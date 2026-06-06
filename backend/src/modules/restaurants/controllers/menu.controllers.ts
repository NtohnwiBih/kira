import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiBody,
} from '@nestjs/swagger';

import { JwtAuthGuard }             from '../../auth/guards/jwt-auth.guard';
import { Public, CurrentUser }      from '../../auth/decorators';
import type { AuthenticatedUser }        from '../../auth/interfaces';

import { RestaurantOwnershipGuard } from '../guards/restaurant-owner.guard';
import { ManagerPermissionGuard } from '../guards/manager-permission.guard';
import { RequiresPermission } from '../decorators/restaurant.decorators';

import { MenuService }              from '../services/menu.service';
import {
  CreateMenuDto,
  UpdateMenuDto,
  CreateMenuCategoryDto,
  UpdateMenuCategoryDto,
  CreateMenuItemDto,
  UpdateMenuItemDto,
  UpdateStockDto,
  CreateCustomizationGroupDto,
  SetDailyAvailabilityDto,
  MenuResponseDto,
  MenuItemResponseDto,
  MessageResponseDto,
} from '../dto/restaurant.dto';

@ApiTags('Restaurant Menus')
@ApiBearerAuth('BearerAuth')
@Controller('restaurants/:restaurantId')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ══════════════════════════════════════════════════════════════════════════
  // MENUS
  // ══════════════════════════════════════════════════════════════════════════

  @Post('menus')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Create a menu',
    description:
      '**CONSTANT** menus are always active. ' +
      '**DAILY** menus require `activeDate` (ISO `YYYY-MM-DD`) and expire automatically at midnight. ' +
      'Only one DAILY menu can exist per date per restaurant.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiResponse({ status: 201, type: MenuResponseDto })
  @ApiResponse({ status: 409, description: 'Daily menu already exists for this date' })
  async createMenu(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: CreateMenuDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.createMenu(restaurantId, dto, user.id);
  }

  @Get('menus')
  @Public()
  @ApiOperation({ summary: 'List all menus for a restaurant (public)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiResponse({ status: 200, type: [MenuResponseDto] })
  async getMenus(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ) {
    return this.menuService.getMenus(restaurantId);
  }

  @Get('menus/:menuId')
  @Public()
  @ApiOperation({ summary: 'Get a menu with all categories and items (public)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiResponse({ status: 200, description: 'Menu with nested categories and items' })
  @ApiResponse({ status: 404, description: 'Menu not found' })
  async getMenu(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuId',       ParseUUIDPipe) menuId: string,
  ) {
    return this.menuService.getMenuById(menuId, restaurantId);
  }

  @Patch('menus/:menuId')
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({ summary: 'Update menu title, type, or active state' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiResponse({ status: 200, type: MenuResponseDto })
  async updateMenu(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuId',       ParseUUIDPipe) menuId: string,
    @Body() dto: UpdateMenuDto,
  ) {
    return this.menuService.updateMenu(menuId, restaurantId, dto);
  }

  @Delete('menus/:menuId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({ summary: 'Soft-delete a menu and all its contents' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deleteMenu(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuId',       ParseUUIDPipe) menuId: string,
  ) {
    return this.menuService.deleteMenu(menuId, restaurantId);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CATEGORIES
  // ══════════════════════════════════════════════════════════════════════════

  @Post('menus/:menuId/categories')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Add a category to a menu',
    description:
      'Set `itemType: FOOD` for food sections and `itemType: DRINK` for drink sections. ' +
      'This separates the menu into typed sections in the customer UI.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiResponse({ status: 201, description: 'Category created' })
  async createCategory(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuId',       ParseUUIDPipe) menuId: string,
    @Body() dto: CreateMenuCategoryDto,
  ) {
    return this.menuService.createCategory(menuId, restaurantId, dto);
  }

  @Patch('menus/:menuId/categories/:categoryId')
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({ summary: 'Update a menu category' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiParam({ name: 'categoryId',   description: 'Category UUID' })
  @ApiResponse({ status: 200, description: 'Category updated' })
  async updateCategory(
    @Param('menuId',     ParseUUIDPipe) menuId: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: UpdateMenuCategoryDto,
  ) {
    return this.menuService.updateCategory(categoryId, menuId, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // MENU ITEMS
  // ══════════════════════════════════════════════════════════════════════════

  @Post('menus/:menuId/items')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Add an item to a menu',
    description:
      'Creates a FOOD or DRINK item inside the specified category. ' +
      'Drink items support `drinkTemp`, `drinkContainer`, `volume`, and `sizes` fields. ' +
      'AI metadata (`tags`, `keywords`, `dietaryLabels`, `allergens`) is optional but ' +
      'improves search and recommendation quality.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiResponse({ status: 201, type: MenuItemResponseDto })
  async createItem(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('menuId',       ParseUUIDPipe) menuId: string,
    @Body() dto: CreateMenuItemDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.menuService.createItem(restaurantId, menuId, dto, user.id);
  }

  @Get('menus/:menuId/items/:itemId')
  @Public()
  @ApiOperation({ summary: 'Get a single menu item with customization groups (public)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiParam({ name: 'itemId',       description: 'Item UUID' })
  @ApiResponse({ status: 200, type: MenuItemResponseDto })
  async getItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ) {
    return this.menuService.getItemById(itemId);
  }

  @Patch('menus/:menuId/items/:itemId')
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Update a menu item',
    description: 'All fields are optional. Toggle `isAvailable` to instantly hide/show the item.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiParam({ name: 'itemId',       description: 'Item UUID' })
  @ApiResponse({ status: 200, type: MenuItemResponseDto })
  async updateItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateMenuItemDto,
  ) {
    return this.menuService.updateItem(itemId, dto);
  }

  @Delete('menus/:menuId/items/:itemId')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({ summary: 'Remove a menu item (soft-delete)' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiParam({ name: 'itemId',       description: 'Item UUID' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async deleteItem(
    @Param('itemId', ParseUUIDPipe) itemId: string,
  ): Promise<MessageResponseDto> {
    return this.menuService.deleteItem(itemId);
  }

  // ── Stock ─────────────────────────────────────────────────────────────────

  @Patch('menus/:menuId/items/:itemId/stock')
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Update item stock quantity',
    description:
      'Set `stockQuantity: null` for unlimited stock. ' +
      'Setting to `0` automatically marks the item as unavailable. ' +
      'A low-stock event is emitted when quantity falls to or below the threshold (default 5).',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiParam({ name: 'itemId',       description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Stock updated' })
  async updateStock(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('itemId',       ParseUUIDPipe) itemId: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.menuService.updateStock(
      itemId,
      restaurantId,
      dto.stockQuantity ?? null,
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // CUSTOMIZATION GROUPS
  // ══════════════════════════════════════════════════════════════════════════

  @Post('menus/:menuId/items/:itemId/customizations')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Add a customization group with options to an item',
    description:
      'Examples:\n' +
      '- **Required side** — `isRequired: true`, `minSelect: 1`, `maxSelect: 1`, ' +
      'options: Plantains, Fries, Vegetables\n' +
      '- **Optional extras** — `isRequired: false`, `minSelect: 0`, `maxSelect: 3`, ' +
      'options: Extra cheese (+500 XAF), Bacon (+800 XAF)\n\n' +
      'Up to 10 groups per item. Up to 20 options per group.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiParam({ name: 'itemId',       description: 'Item UUID' })
  @ApiResponse({ status: 201, description: 'Customization group created with options' })
  @ApiResponse({ status: 400, description: 'Maximum 10 groups per item' })
  async addCustomization(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: CreateCustomizationGroupDto,
  ) {
    return this.menuService.addCustomizationGroup(itemId, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  // DAILY AVAILABILITY  (DAILY menu items only)
  // ══════════════════════════════════════════════════════════════════════════

  @Post('menus/:menuId/items/:itemId/availability')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
  @RequiresPermission('canEditMenu')
  @ApiOperation({
    summary: 'Set per-day availability for a DAILY menu item',
    description:
      'Upserts an availability record for a specific date. Use this to:\n' +
      '- Mark an item as sold out for a day (`isAvailable: false`)\n' +
      '- Set a day-specific stock quantity\n' +
      '- Add a daily special note ("Last 5 portions — order now!")\n' +
      '- Override the price for a day-special deal\n\n' +
      'Calling again with the same `itemId + date` updates the existing record.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'menuId',       description: 'Menu UUID' })
  @ApiParam({ name: 'itemId',       description: 'Item UUID' })
  @ApiResponse({ status: 200, description: 'Daily availability set' })
  async setDailyAvailability(
    @Param('itemId', ParseUUIDPipe) itemId: string,
    @Body() dto: SetDailyAvailabilityDto,
  ) {
    return this.menuService.setDailyAvailability(itemId, dto);
  }
}