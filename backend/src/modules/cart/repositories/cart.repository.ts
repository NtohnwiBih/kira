import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { ICartItemData } from '../interfaces/cart.interface';

// ── Shared include shape ───────────────────────────────────────────────────────
const CART_FULL_INCLUDE = {
  restaurant: {
    select: {
      id:                 true,
      name:               true,
      logoUrl:            true,
      status:             true,
      deliveryFee:        true,
      minimumOrderAmount: true,
    },
  },
  items: {
    orderBy: { createdAt: 'asc' as const },
    include: {
      menuItem: {
        select: {
          id:          true,
          name:        true,
          imageUrl:    true,
          isAvailable: true,
          price:       true,
        },
      },
      customizations: {
        orderBy: { createdAt: 'asc' as const },
      },
    },
  },
} as const;

@Injectable()
export class CartRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  async findActiveByUserId(userId: string) {
    return this.prisma.cart.findFirst({
      where:   { userId, status: 'ACTIVE' },
      include: CART_FULL_INCLUDE,
    });
  }

  async findOrCreate(userId: string) {
    // Try to find existing active cart first
    const existing = await this.findActiveByUserId(userId);
    if (existing) return existing;

    // Create a fresh cart
    return this.prisma.cart.create({
      data:    { userId, status: 'ACTIVE' },
      include: CART_FULL_INCLUDE,
    });
  }

  async findItemById(itemId: string, cartId: string) {
    return this.prisma.cartItem.findFirst({
      where:   { id: itemId, cartId },
      include: { customizations: true },
    });
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async setRestaurant(cartId: string, restaurantId: string | null) {
    return this.prisma.cart.update({
      where: { id: cartId },
      data:  { restaurantId },
    });
  }

  async addItem(cartId: string, data: ICartItemData) {
    return this.prisma.cartItem.create({
      data: {
        cartId,
        menuItemId:          data.menuItemId,
        name:                data.name,
        unitPrice:           data.unitPrice,
        quantity:            data.quantity,
        customizationTotal:  data.customizationTotal,
        lineTotal:           data.lineTotal,
        notes:               data.notes,
        customizations: {
          create: data.customizations.map((c) => ({
            groupId:    c.groupId,
            groupName:  c.groupName,
            optionId:   c.optionId,
            optionName: c.optionName,
            priceAdd:   c.priceAdd,
          })),
        },
      },
      include: { customizations: true },
    });
  }

  async updateItemQuantity(
    itemId:    string,
    quantity:  number,
    lineTotal: number,
    notes?:    string,
  ) {
    return this.prisma.cartItem.update({
      where: { id: itemId },
      data:  { quantity, lineTotal, ...(notes !== undefined && { notes }) },
      include: { customizations: true },
    });
  }

  async removeItem(itemId: string) {
    // Cascade deletes CartItemCustomization rows automatically (onDelete: Cascade)
    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  async countItems(cartId: string): Promise<number> {
    return this.prisma.cartItem.count({ where: { cartId } });
  }

  async clearItems(cartId: string) {
    await this.prisma.cartItem.deleteMany({ where: { cartId } });
    return this.prisma.cart.update({
      where:   { id: cartId },
      data:    { restaurantId: null, promoCode: null, discountAmount: null },
      include: CART_FULL_INCLUDE,
    });
  }

  async markCheckedOut(cartId: string) {
    return this.prisma.cart.update({
      where: { id: cartId },
      data:  { status: 'CHECKED_OUT' },
    });
  }

  async applyPromo(cartId: string, code: string, discountAmount: number) {
    return this.prisma.cart.update({
      where: { id: cartId },
      data:  { promoCode: code, discountAmount },
    });
  }

  async removePromo(cartId: string) {
    return this.prisma.cart.update({
      where: { id: cartId },
      data:  { promoCode: null, discountAmount: null },
    });
  }
}