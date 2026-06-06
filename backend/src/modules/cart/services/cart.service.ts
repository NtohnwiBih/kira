
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 }                          from '@nestjs/event-emitter';
import { PrismaService }                          from 'src/database/prisma/prisma.service';

import { CartRepository }      from '../repositories/cart.repository';
import { CART_CONSTANTS }      from '../constants/cart.constants';
import {
  ICartCustomization,
  IValidatedCustomizations,
} from '../interfaces/cart.interface';
import {
  AddCartItemDto,
  UpdateCartItemDto,
  CartResponseDto,
  CartItemResponseDto,
} from '../dto/cart.dto';
import {
  CartItemNotFoundException,
  CartEmptyException,
  CartMaxItemsException,
  InvalidCartRestaurantException,
  MenuItemUnavailableException,
  InvalidCustomizationException,
  RequiredCustomizationMissingException,
} from '../exceptions/cart.exception';
import {
  CartItemAddedEvent,
  CartItemRemovedEvent,
  CartClearedEvent,
} from '../events/cart.events';

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(
    private readonly cartRepo: CartRepository,
    private readonly prisma:   PrismaService,
    private readonly emitter:  EventEmitter2,
  ) {}

  // ── GET /cart ──────────────────────────────────────────────────────────────

  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findOrCreate(userId);
    return this.toResponse(cart);
  }

  // ── POST /cart/items ───────────────────────────────────────────────────────

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findOrCreate(userId);

    // ── 1. Load menu item with its customization groups ──────────────────────
    const menuItem = await this.prisma.menuItem.findFirst({
      where:   { id: dto.menuItemId, deletedAt: null },
      include: {
        menu: { select: { restaurantId: true } },
        customizationGroups: {
          where:   { isActive: true },
          include: {
            options: { where: { isAvailable: true } },
          },
        },
      },
    });

    if (!menuItem) throw new NotFoundException('Menu item not found.');
    if (!menuItem.isAvailable) throw new MenuItemUnavailableException(menuItem.name);

    const itemRestaurantId = menuItem.menu.restaurantId;

    // ── 2. Restaurant isolation check ────────────────────────────────────────
    if (cart.restaurantId && cart.restaurantId !== itemRestaurantId) {
      throw new InvalidCartRestaurantException();
    }

    // ── 3. Cart size guard ───────────────────────────────────────────────────
    const itemCount = await this.cartRepo.countItems(cart.id);
    if (itemCount >= CART_CONSTANTS.MAX_ITEMS_PER_CART) {
      throw new CartMaxItemsException(CART_CONSTANTS.MAX_ITEMS_PER_CART);
    }

    // ── 4. Validate & price customizations ───────────────────────────────────
    const { customizations, customizationTotal } =
      this.validateAndPriceCustomizations(
        dto.customizations ?? [],
        menuItem.customizationGroups as any,
      );

    // ── 5. Compute line total ────────────────────────────────────────────────
    const unitPrice = Number(menuItem.price);
    const lineTotal = (unitPrice + customizationTotal) * dto.quantity;

    // ── 6. Bind restaurant if this is the first item ─────────────────────────
    if (!cart.restaurantId) {
      await this.cartRepo.setRestaurant(cart.id, itemRestaurantId);
    }

    // ── 7. Persist ───────────────────────────────────────────────────────────
    await this.cartRepo.addItem(cart.id, {
      menuItemId:         dto.menuItemId,
      name:               menuItem.name,
      unitPrice,
      quantity:           dto.quantity,
      customizationTotal,
      lineTotal,
      notes:              dto.notes,
      customizations,
    });

    this.emitter.emit(
      CartItemAddedEvent.EVENT,
      new CartItemAddedEvent(userId, dto.menuItemId, dto.quantity, lineTotal),
    );

    this.logger.log(`Cart item added userId=${userId} item=${dto.menuItemId}`);
    return this.getCart(userId);
  }

  // ── PATCH /cart/items/:id ─────────────────────────────────────────────────

  async updateItem(
    userId: string,
    itemId: string,
    dto:    UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findOrCreate(userId);
    const item = await this.cartRepo.findItemById(itemId, cart.id);
    if (!item) throw new CartItemNotFoundException();

    // Recalculate line total with new quantity
    const lineTotal =
      (Number(item.unitPrice) + Number(item.customizationTotal)) * dto.quantity;

    await this.cartRepo.updateItemQuantity(itemId, dto.quantity, lineTotal, dto.notes);

    this.logger.log(`Cart item updated userId=${userId} itemId=${itemId} qty=${dto.quantity}`);
    return this.getCart(userId);
  }

  // ── DELETE /cart/items/:id ────────────────────────────────────────────────

  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findOrCreate(userId);
    const item = await this.cartRepo.findItemById(itemId, cart.id);
    if (!item) throw new CartItemNotFoundException();

    await this.cartRepo.removeItem(itemId);

    // If the cart is now empty, unbind the restaurant
    const remaining = await this.cartRepo.countItems(cart.id);
    if (remaining === 0) {
      await this.cartRepo.setRestaurant(cart.id, null);
    }

    this.emitter.emit(
      CartItemRemovedEvent.EVENT,
      new CartItemRemovedEvent(userId, item.menuItemId),
    );

    return this.getCart(userId);
  }

  // ── DELETE /cart/clear ────────────────────────────────────────────────────

  async clearCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepo.findOrCreate(userId);
    const cleared = await this.cartRepo.clearItems(cart.id);

    this.emitter.emit(CartClearedEvent.EVENT, new CartClearedEvent(userId));

    this.logger.log(`Cart cleared userId=${userId}`);
    return this.toResponse(cleared);
  }

  // ── Called by OrderService after successful checkout ──────────────────────

  async checkoutCart(userId: string): Promise<void> {
    const cart = await this.cartRepo.findActiveByUserId(userId);
    if (cart) {
      await this.cartRepo.markCheckedOut(cart.id);
      this.logger.log(`Cart checked out userId=${userId} cartId=${cart.id}`);
    }
  }

  // ── Validate customizations ───────────────────────────────────────────────
  // Called during addItem. Groups are loaded from DB so the service owns
  // the validation logic with real data — not re-fetched inside the repo.

  private validateAndPriceCustomizations(
    selections: Array<{ groupId: string; optionId: string }>,
    groups:     Array<{
      id:         string;
      name:       string;
      isRequired: boolean;
      minSelect:  number;
      maxSelect:  number;
      options:    Array<{ id: string; name: string; priceAdd: any; isAvailable: boolean }>;
    }>,
  ): IValidatedCustomizations {
    const result: ICartCustomization[] = [];
    let customizationTotal = 0;

    // Index selections by groupId for O(1) lookups
    const selectionsByGroup = new Map<string, string[]>();
    for (const s of selections) {
      const arr = selectionsByGroup.get(s.groupId) ?? [];
      arr.push(s.optionId);
      selectionsByGroup.set(s.groupId, arr);
    }

    for (const group of groups) {
      const selectedOptionIds = selectionsByGroup.get(group.id) ?? [];
      const count = selectedOptionIds.length;

      // Required group — must have at least minSelect selections
      if (group.isRequired && count < group.minSelect) {
        throw new RequiredCustomizationMissingException(group.name);
      }

      // Minimum not met (even for optional groups with a min)
      if (count > 0 && count < group.minSelect) {
        throw new InvalidCustomizationException(
          `'${group.name}' requires at least ${group.minSelect} selection(s).`,
        );
      }

      // Exceeded maximum
      if (count > group.maxSelect) {
        throw new InvalidCustomizationException(
          `'${group.name}' allows a maximum of ${group.maxSelect} selection(s).`,
        );
      }

      // Validate each selected option belongs to this group and is available
      for (const optionId of selectedOptionIds) {
        const option = group.options.find((o) => o.id === optionId);
        if (!option) {
          throw new InvalidCustomizationException(
            `Option '${optionId}' does not belong to group '${group.name}'.`,
          );
        }
        if (!option.isAvailable) {
          throw new InvalidCustomizationException(
            `Option '${option.name}' is currently unavailable.`,
          );
        }

        const priceAdd = Number(option.priceAdd);
        customizationTotal += priceAdd;

        result.push({
          groupId:    group.id,
          groupName:  group.name,
          optionId:   option.id,
          optionName: option.name,
          priceAdd,
        });
      }
    }

    // Reject any selections for groups that don't exist on this item
    for (const [groupId] of selectionsByGroup) {
      const exists = groups.some((g) => g.id === groupId);
      if (!exists) {
        throw new InvalidCustomizationException(
          `Customization group '${groupId}' does not belong to this item.`,
        );
      }
    }

    return { customizations: result, customizationTotal };
  }

  // ── Response mapper ───────────────────────────────────────────────────────

  private toResponse(cart: any): CartResponseDto {
    const items: CartItemResponseDto[] = (cart.items ?? []).map((i: any) => ({
      id:                 i.id,
      menuItemId:         i.menuItemId,
      name:               i.name,
      imageUrl:           i.menuItem?.imageUrl ?? null,
      unitPrice:          Number(i.unitPrice),
      quantity:           i.quantity,
      customizationTotal: Number(i.customizationTotal),
      lineTotal:          Number(i.lineTotal),
      notes:              i.notes ?? null,
      customizations:     (i.customizations ?? []).map((c: any) => ({
        groupId:    c.groupId,
        groupName:  c.groupName,
        optionId:   c.optionId,
        optionName: c.optionName,
        priceAdd:   Number(c.priceAdd),
      })),
    }));

    const subtotal      = items.reduce((s, i) => s + i.lineTotal, 0);
    const discountAmount = Number(cart.discountAmount ?? 0);
    const deliveryFee   = Number(cart.restaurant?.deliveryFee ?? 0);
    const grandTotal    = Math.max(0, subtotal + deliveryFee - discountAmount);

    return {
      id:         cart.id,
      restaurant: cart.restaurant
        ? {
            id:                 cart.restaurant.id,
            name:               cart.restaurant.name,
            logoUrl:            cart.restaurant.logoUrl ?? null,
            deliveryFee:        Number(cart.restaurant.deliveryFee ?? 0),
            minimumOrderAmount: Number(cart.restaurant.minimumOrderAmount ?? 0),
          }
        : null,
      items,
      itemCount:  items.reduce((s, i) => s + i.quantity, 0),
      totals: {
        subtotal,
        discountAmount,
        deliveryFee,
        grandTotal,
      },
      promoCode:  cart.promoCode ?? null,
      updatedAt:  cart.updatedAt,
    };
  }
}