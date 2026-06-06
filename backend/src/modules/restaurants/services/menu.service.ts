import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 }      from '@nestjs/event-emitter';
import { MenuRepository, RestaurantRepository }     from '../repositories';
import {
  CreateMenuDto, UpdateMenuDto, CreateMenuItemDto, UpdateMenuItemDto,
  CreateMenuCategoryDto, CreateCustomizationGroupDto,
  SetDailyAvailabilityDto,
  UpdateMenuCategoryDto,
} from '../dto/restaurant.dto';
import {
  MenuNotFoundException, MenuLimitExceededException, MenuItemNotFoundException,
  MenuCategoryNotFoundException, DailyMenuAlreadyExistsException,
  CustomizationGroupLimitException,
} from '../exceptions/restaurant.exceptions';
import {
  MenuItemCreatedEvent, LowStockAlertEvent, MenuItemAvailabilityChangedEvent,
} from '../events/restaurant.events';
import { RestaurantService }  from './restaurant.service';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ONBOARDING_STEP, RESTAURANT_CONSTANTS } from '../constants/restaurant.contant';

@Injectable()
export class MenuService {
  private readonly logger = new Logger(MenuService.name);

  constructor(
    private readonly menuRepo:        MenuRepository,
    private readonly restaurantRepo:  RestaurantRepository,
    private readonly restaurantSvc:   RestaurantService,
    private readonly emitter:         EventEmitter2,
    private readonly prisma:          PrismaService,
  ) {}

  // ── Menu CRUD ─────────────────────────────────────────────────────────────

  async createMenu(restaurantId: string, dto: CreateMenuDto, userId: string) {
    const count = await this.menuRepo.countMenus(restaurantId);
    if (count >= RESTAURANT_CONSTANTS.MAX_MENUS_PER_RESTAURANT) {
      throw new MenuLimitExceededException(RESTAURANT_CONSTANTS.MAX_MENUS_PER_RESTAURANT);
    }

    // Prevent duplicate daily menus for same date
    if (dto.menuType === 'DAILY' && dto.activeDate) {
      const existing = await this.menuRepo.findDailyMenuByDate(
        restaurantId,
        new Date(dto.activeDate),
      );
      if (existing) throw new DailyMenuAlreadyExistsException(dto.activeDate);
    }

    const menu = await this.menuRepo.createMenu({
      restaurant:  { connect: { id: restaurantId } },
      title:       dto.title,
      description: dto.description,
      menuType:    dto.menuType,
      activeDate:  dto.activeDate ? new Date(dto.activeDate) : undefined,
      createdById: userId,
    } as never);

    this.logger.log(`Menu created id=${menu.id} restaurant=${restaurantId}`);
    return menu;
  }

  async getMenus(restaurantId: string) {
    return this.menuRepo.findMenusByRestaurant(restaurantId);
  }

  async getMenuById(menuId: string, restaurantId: string) {
    const menu = await this.menuRepo.findMenuById(menuId, restaurantId);
    if (!menu) throw new MenuNotFoundException();
    return menu;
  }

  async updateMenu(menuId: string, restaurantId: string, dto: UpdateMenuDto) {
    const menu = await this.menuRepo.findMenuById(menuId, restaurantId);
    if (!menu) throw new MenuNotFoundException();
    return this.menuRepo.updateMenu(menuId, dto as never);
  }

  async deleteMenu(menuId: string, restaurantId: string) {
    const menu = await this.menuRepo.findMenuById(menuId, restaurantId);
    if (!menu) throw new MenuNotFoundException();
    await this.menuRepo.softDeleteMenu(menuId);
    return { message: 'Menu deleted successfully.' };
  }

  // ── Category CRUD ─────────────────────────────────────────────────────────

  async createCategory(menuId: string, restaurantId: string, dto: CreateMenuCategoryDto) {
    const menu = await this.menuRepo.findMenuById(menuId, restaurantId);
    if (!menu) throw new MenuNotFoundException();

    const count = await this.menuRepo.countCategories(menuId);
    if (count >= RESTAURANT_CONSTANTS.MAX_CATEGORIES_PER_MENU) {
      throw new MenuLimitExceededException(RESTAURANT_CONSTANTS.MAX_CATEGORIES_PER_MENU);
    }

    return this.menuRepo.createCategory({ menu: { connect: { id: menuId } }, ...dto } as never);
  }

  // ── Menu Item CRUD ────────────────────────────────────────────────────────

  async createItem(
    restaurantId: string,
    menuId:       string,
    dto:          CreateMenuItemDto,
    userId:       string,
  ) {
    // Validate category belongs to this menu
    const category = await this.menuRepo.findCategoryById(dto.categoryId, menuId);
    if (!category) throw new MenuCategoryNotFoundException();

    const count = await this.menuRepo.countItemsInCategory(dto.categoryId);
    if (count >= RESTAURANT_CONSTANTS.MAX_ITEMS_PER_CATEGORY) {
      throw new MenuLimitExceededException(RESTAURANT_CONSTANTS.MAX_ITEMS_PER_CATEGORY);
    }

    const item = await this.menuRepo.createItem({
      menu:            { connect: { id: menuId } },
      category:        { connect: { id: dto.categoryId } },
      name:            dto.name,
      description:     dto.description,
      price:           dto.price,
      itemType:        dto.itemType,
      preparationTime: dto.preparationTime ?? 15,
      calories:        dto.calories,
      spicyLevel:      dto.spicyLevel ?? 'NONE',
      stockQuantity:   dto.stockQuantity ?? null,
      drinkTemp:       dto.drinkTemp,
      drinkContainer:  dto.drinkContainer,
      volume:          dto.volume,
      tags:            dto.tags ?? [],
      keywords:        dto.keywords ?? [],
      dietaryLabels:   dto.dietaryLabels ?? [],
    } as never);

    this.emitter.emit(
      MenuItemCreatedEvent.EVENT,
      new MenuItemCreatedEvent(restaurantId, item.id, item.name, Number(item.price)),
    );

    // Advance onboarding to MENU step
    await this.restaurantSvc.advanceOnboarding(restaurantId, ONBOARDING_STEP.MENU + 1);

    this.logger.log(`Menu item created id=${item.id} restaurant=${restaurantId}`);
    return item;
  }

  async updateItem(itemId: string, dto: UpdateMenuItemDto) {
    const item = await this.menuRepo.findItemById(itemId);
    if (!item) throw new MenuItemNotFoundException();

    const updated = await this.menuRepo.updateItem(itemId, dto as never);

    if (dto.isAvailable !== undefined && dto.isAvailable !== item.isAvailable) {
      this.emitter.emit(
        MenuItemAvailabilityChangedEvent.EVENT,
        new MenuItemAvailabilityChangedEvent('', itemId, dto.isAvailable),
      );
    }

    return updated;
  }

  async deleteItem(itemId: string) {
    const item = await this.menuRepo.findItemById(itemId);
    if (!item) throw new MenuItemNotFoundException();
    await this.menuRepo.softDeleteItem(itemId);
    return { message: 'Menu item removed.' };
  }

  // ── Stock management ──────────────────────────────────────────────────────

  async updateStock(
    itemId:        string,
    restaurantId:  string,
    stockQuantity: number | null,
  ) {
    const item = await this.menuRepo.findItemById(itemId);
    if (!item) throw new MenuItemNotFoundException();

    const updated = await this.menuRepo.updateItem(itemId, {
      stockQuantity,
      isAvailable: stockQuantity === null || stockQuantity > 0,
    } as never);

    // Emit low-stock alert so the restaurant owner can be notified
    if (
      stockQuantity !== null &&
      stockQuantity <= RESTAURANT_CONSTANTS.STOCK_LOW_THRESHOLD &&
      stockQuantity > 0
    ) {
      this.emitter.emit(
        LowStockAlertEvent.EVENT,
        new LowStockAlertEvent(restaurantId, itemId, item.name, stockQuantity),
      );
    }

    return updated;
  }

  // ── Customization ─────────────────────────────────────────────────────────
  //
  // ⚠️  `itemCustomizationGroup` is a NEW model — not yet in the generated
  //     Prisma client.  The `(this.prisma as any)` cast keeps this file
  //     compiling until you run `npx prisma generate`.
  //     After regenerating: replace `(this.prisma as any)` with `this.prisma`.

  async addCustomizationGroup(
    itemId: string,
    dto:    CreateCustomizationGroupDto,
  ) {
    const item = await this.menuRepo.findItemById(itemId);
    if (!item) throw new MenuItemNotFoundException();

    const db = this.prisma 

    const existingGroups = await db.itemCustomizationGroup.count({
      where: { menuItemId: itemId, isActive: true },
    });
    if (existingGroups >= RESTAURANT_CONSTANTS.MAX_CUSTOMIZATION_GROUPS) {
      throw new CustomizationGroupLimitException(RESTAURANT_CONSTANTS.MAX_CUSTOMIZATION_GROUPS);
    }

    return db.itemCustomizationGroup.create({
      data: {
        menuItemId:  itemId,
        name:        dto.name,
        description: dto.description,
        isRequired:  dto.isRequired,
        minSelect:   dto.minSelect,
        maxSelect:   dto.maxSelect,
        options: {
          create: dto.options.map((o, idx) => ({
            name:      o.name,
            priceAdd:  o.priceAdd,
            isDefault: o.isDefault ?? false,
            calories:  o.calories,
            sortOrder: idx,
          })),
        },
      },
      include: { options: true },
    });
  }

  // ── Daily availability ────────────────────────────────────────────────────
  //
  // ⚠️  `dailyMenuAvailability` is a NEW model — same cast reasoning as above.

  async setDailyAvailability(itemId: string, dto: SetDailyAvailabilityDto) {
    const item = await this.menuRepo.findItemById(itemId);
    if (!item) throw new MenuItemNotFoundException();

    const db = this.prisma

    return db.dailyMenuAvailability.upsert({
      where: {
        menuItemId_date: {
          menuItemId: itemId,
          date:       new Date(dto.date),
        },
      },
      create: {
        menuItemId:  itemId,
        date:        new Date(dto.date),
        isAvailable: dto.isAvailable,
        stockQty:    dto.stockQty,
        specialNote: dto.specialNote,
      },
      update: {
        isAvailable: dto.isAvailable,
        stockQty:    dto.stockQty,
        specialNote: dto.specialNote,
      },
    });
  }

  async getItemById(itemId: string) {
    const item = await this.menuRepo.findItemById(itemId);
    if (!item) throw new MenuItemNotFoundException();
    return item;
  }

  async updateCategory(categoryId: string, menuId: string, dto: UpdateMenuCategoryDto) {
    const category = await this.menuRepo.findCategoryById(categoryId, menuId);
    if (!category) throw new MenuCategoryNotFoundException();
    return this.menuRepo.updateCategory(categoryId, dto as never);
  }
}
