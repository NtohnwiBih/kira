import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { OrderRepository } from '../repositories/order.repository';
import { CartService } from '../../cart/services/cart.service';
import {
  CheckoutDto, ConfirmOrderDto, RejectOrderDto, CancelOrderDto,
  OrderResponseDto, OrderSummaryDto, PaginatedOrdersDto, CheckoutResponseDto,
} from '../dto/order.dto';
import {
  OrderCreatedEvent, OrderConfirmedEvent, OrderCancelledEvent,
} from '../events/order.events';
import {
  OrderNotFoundException, InvalidOrderStatusTransitionException,
  OrderCancellationWindowExpiredException, OrderNotOwnedByUserException,
  RestaurantClosedException, RestaurantInactiveException,
  MinimumOrderAmountException,
} from '../exceptions/order.exceptions';
import { ORDER_CONSTANTS } from '../constants/order.constants';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private readonly orderRepo:   OrderRepository,
    private readonly cartService: CartService,
    private readonly emitter:     EventEmitter2,
    private readonly prisma:      PrismaService,
  ) {}

  // ── Checkout ───────────────────────────────────────────────────────────────

  async checkout(userId: string, dto: CheckoutDto): Promise<CheckoutResponseDto> {
    const cart = await this.cartService.getCart(userId);

    const restaurantId = cart.restaurant?.id;
    if (!restaurantId || cart.items.length === 0) {
      throw new RestaurantClosedException();
    }

    const address = await this.prisma.userAddress.findFirst({
      where: { id: dto.addressId, userId, deletedAt: null },
    });
    if (!address) throw new OrderNotFoundException('Delivery address not found.');

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });
    if (!restaurant) throw new RestaurantInactiveException();
    if (restaurant.status === 'CLOSED' || restaurant.status === 'PAUSED') {
      throw new RestaurantClosedException();
    }
    if (!restaurant.isActive) throw new RestaurantInactiveException();

    const deliveryFee     = Number(restaurant.deliveryFee ?? 0);
    const subtotal       = cart.totals.subtotal;
    const discountAmount = cart.totals.discountAmount ?? 0;
    const total           = Math.max(0, subtotal + deliveryFee - discountAmount);

    if (restaurant.minimumOrderAmount && subtotal < Number(restaurant.minimumOrderAmount)) {
      throw new MinimumOrderAmountException(Number(restaurant.minimumOrderAmount));
    }

    const orderNumber = await this.orderRepo.generateOrderNumber();

    const order = await this.prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId,
          restaurantId:        restaurantId!,
          status:              'PENDING' as any,
          subtotal,
          deliveryFee,
          discountAmount,
          total,
          deliveryAddress:     `${address.street}, ${address.city}`,
          deliveryLat:         address.lat,
          deliveryLng:         address.lng,
          deliveryNotes:       address.instructions,
          specialInstructions: dto.specialInstructions,
          addressId:           dto.addressId,
          items: {
            create: cart.items.map((item) => ({
              menuItemId:         item.menuItemId,
              name:               item.name,
              unitPrice:          item.unitPrice,
              quantity:           item.quantity,
              customizationTotal: item.customizationTotal,
              customizations: item.customizations
                ? JSON.parse(JSON.stringify(item.customizations))
                : null,
              lineTotal:          item.lineTotal,
              notes:              item.notes,
            })),
          },
        },
        include: { items: true, restaurant: { select: { name: true } } },
      });

      await tx.orderStatusHistory.create({
        data: { orderId: created.id, status: 'PENDING' as any, changedById: userId },
      });

      return created;
    });

    await this.cartService.checkoutCart(userId);

    this.emitter.emit(
      OrderCreatedEvent.EVENT,
      new OrderCreatedEvent(order.id, userId, restaurantId!, orderNumber, total),
    );

    this.logger.log(`Order created ${orderNumber} userId=${userId}`);

    const full = await this.orderRepo.findById(order.id);
    return {
      order:   this.toResponse(full),
      message: 'Order placed successfully. Awaiting restaurant confirmation.',
    };
  }

  // ── Confirm (restaurant) ───────────────────────────────────────────────────

  async confirm(orderId: string, dto: ConfirmOrderDto, restaurantId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new OrderNotFoundException(orderId);
    if (order.restaurantId !== restaurantId) throw new OrderNotOwnedByUserException();

    this.assertTransition(order.status, 'CONFIRMED');

    const updated = await this.orderRepo.updateStatus(orderId, 'CONFIRMED', {
      estimatedPrepTime: dto.estimatedPrepTime,
      confirmedAt:       new Date(),
    });
    await this.orderRepo.appendStatusHistory(orderId, 'CONFIRMED', restaurantId);

    this.emitter.emit(
      OrderConfirmedEvent.EVENT,
      new OrderConfirmedEvent(orderId, order.userId, restaurantId, dto.estimatedPrepTime),
    );

    return this.toResponse(updated);
  }

  // ── Reject (restaurant) ────────────────────────────────────────────────────

  async reject(orderId: string, dto: RejectOrderDto, restaurantId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new OrderNotFoundException(orderId);
    if (order.restaurantId !== restaurantId) throw new OrderNotOwnedByUserException();

    this.assertTransition(order.status, 'CANCELLED');

    const updated = await this.orderRepo.updateStatus(orderId, 'CANCELLED', {
      cancelReason:  dto.reason,
      cancelledById: restaurantId,
      cancelledAt:   new Date(),
    });
    await this.orderRepo.appendStatusHistory(orderId, 'CANCELLED', restaurantId, dto.reason);

    this.emitter.emit(
      OrderCancelledEvent.EVENT,
      new OrderCancelledEvent(orderId, order.userId, restaurantId, dto.reason, 'restaurant'),
    );

    return this.toResponse(updated);
  }

  // ── Cancel (customer) ──────────────────────────────────────────────────────

  async cancel(orderId: string, dto: CancelOrderDto, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new OrderNotFoundException(orderId);
    if (order.userId !== userId) throw new OrderNotOwnedByUserException();

    this.assertTransition(order.status, 'CANCELLED');

    if (order.status === 'CONFIRMED' && order.confirmedAt) {
      const elapsed = (Date.now() - new Date(order.confirmedAt).getTime()) / 1000;
      if (elapsed > ORDER_CONSTANTS.CANCELLATION_WINDOW_SECS) {
        throw new OrderCancellationWindowExpiredException();
      }
    }

    const updated = await this.orderRepo.updateStatus(orderId, 'CANCELLED', {
      cancelReason:  dto.reason,
      cancelledById: userId,
      cancelledAt:   new Date(),
    });
    await this.orderRepo.appendStatusHistory(orderId, 'CANCELLED', userId, dto.reason);

    this.emitter.emit(
      OrderCancelledEvent.EVENT,
      new OrderCancelledEvent(orderId, userId, order.restaurantId, dto.reason, 'customer'),
    );

    return this.toResponse(updated);
  }

  // ── Reads ──────────────────────────────────────────────────────────────────

  async findById(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepo.findByIdAndUser(orderId, userId);
    if (!order) throw new OrderNotFoundException(orderId);
    return this.toResponse(order);
  }

  async findByUser(userId: string, page = 1, limit = 10): Promise<PaginatedOrdersDto> {
    const { data, total } = await this.orderRepo.findByUser(userId, page, limit);
    return {
      data:       data.map((o) => this.toSummary(o)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findByRestaurant(restaurantId: string, page = 1, limit = 20) {
    const { data, total } = await this.orderRepo.findByRestaurant(restaurantId, page, limit);
    return { data: data.map((o) => this.toResponse(o)), total, page, limit };
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private assertTransition(from: string, to: string) {
    const allowed = ORDER_CONSTANTS.ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(to)) {
      throw new InvalidOrderStatusTransitionException(from, to);
    }
  }

  private toResponse(order: any): OrderResponseDto {
    return {
      id:                    order.id,
      orderNumber:           order.orderNumber,
      status:                order.status,
      restaurant:            order.restaurant ?? null,
      items:                 (order.items ?? []).map((i: any) => ({
        id:                 i.id,
        menuItemId:         i.menuItemId,
        name:               i.name,
        unitPrice:          Number(i.unitPrice),
        quantity:           i.quantity,
        customizationTotal: Number(i.customizationTotal ?? 0),
        lineTotal:          Number(i.lineTotal),
        notes:              i.notes ?? null,
        customizations:     i.customizations ?? null,
      })),
      subtotal:              Number(order.subtotal),
      deliveryFee:           Number(order.deliveryFee),
      discountAmount:        Number(order.discountAmount ?? 0),
      total:                 Number(order.total),
      estimatedPrepTime:     order.estimatedPrepTime ?? null,
      estimatedDeliveryTime: order.estimatedDeliveryTime ?? null,
      deliveryAddress:       order.deliveryAddress,
      deliveryNotes:         order.deliveryNotes ?? null,
      specialInstructions:   order.specialInstructions ?? null,
      cancelReason:          order.cancelReason ?? null,
      payment:               order.payment ? {
        id:       order.payment.id,
        status:   order.payment.status,
        provider: order.payment.provider,
        amount:   Number(order.payment.amount),
        paidAt:   order.payment.paidAt ?? null,
      } : null,
      statusHistory:  (order.statusHistory ?? []).map((h: any) => ({
        status:    h.status,
        createdAt: h.createdAt,
        note:      h.note ?? null,
      })),
      placedAt:     order.placedAt,
      confirmedAt:  order.confirmedAt ?? null,
      preparingAt:  order.preparingAt ?? null,
      readyAt:      order.readyAt ?? null,
      pickedUpAt:   order.pickedUpAt ?? null,
      deliveredAt:  order.deliveredAt ?? null,
      cancelledAt:  order.cancelledAt ?? null,
    };
  }

  private toSummary(order: any): OrderSummaryDto {
    return {
      id:             order.id,
      orderNumber:    order.orderNumber,
      status:         order.status,
      restaurantName: order.restaurant?.name ?? null,
      total:          Number(order.total),
      itemCount:      order.items?.reduce((acc: number, i: any) => acc + i.quantity, 0) ?? 0,
      placedAt:       order.placedAt,
    };
  }
}