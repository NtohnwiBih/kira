import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 }      from '@nestjs/event-emitter';

import { KitchenRepository }      from '../repositories/kitchen.repository';
import { KITCHEN_CONSTANTS }      from '../constants/kitchen.constants';
import {
  AcceptOrderDto,
  RejectOrderDto,
  UpdatePrepTimeDto,
  ChangeKitchenStatusDto,
  KitchenOrderResponseDto,
  KitchenWorkloadDto,
  KitchenActionResponseDto,
} from '../dto/kitchen.dto';
import {
  KitchenOrderNotFoundException,
  OrderNotConfirmedException,
  OrderNotPreparingException,
  InvalidKitchenStatusTransitionException,
  OrderNotBelongsToRestaurantException,
} from '../exceptions/kitchen.exceptions';
import {
  KitchenOrderAcceptedEvent,
  KitchenOrderRejectedEvent,
  KitchenOrderPreparingEvent,
  KitchenOrderReadyEvent,
  KitchenPrepTimeUpdatedEvent,
  KitchenStatusChangedEvent,
} from '../events/kitchen.events';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class KitchenService {
  private readonly logger = new Logger(KitchenService.name);

  constructor(
    private readonly kitchenRepo: KitchenRepository,
    private readonly prisma:      PrismaService,
    private readonly emitter:     EventEmitter2,
  ) {}

  // ── GET /kitchen/orders ───────────────────────────────────────────────────

  async getActiveOrders(restaurantId: string): Promise<KitchenOrderResponseDto[]> {
    const orders = await this.kitchenRepo.findActiveOrders(restaurantId);
    return orders.map(this.toResponse);
  }

  // ── GET /kitchen/workload ─────────────────────────────────────────────────

  async getWorkload(restaurantId: string): Promise<KitchenWorkloadDto> {
    const { counts, avgPrepTime } = await this.kitchenRepo.getWorkloadSummary(restaurantId);

    const tally: Record<string, number> = {
      PENDING: 0, CONFIRMED: 0, PREPARING: 0, READY_FOR_PICKUP: 0,
    };
    for (const row of counts) {
      tally[row.status as string] = (row as any)._count.id;
    }

    return {
      pending:        tally.PENDING,
      confirmed:      tally.CONFIRMED,
      preparing:      tally.PREPARING,
      readyForPickup: tally.READY_FOR_PICKUP,
      totalActive:    Object.values(tally).reduce((s, n) => s + n, 0),
      avgPrepTimeMin: Math.round(avgPrepTime),
    };
  }

  // ── POST /kitchen/orders/:id/accept ───────────────────────────────────────

  async acceptOrder(
    orderId:      string,
    restaurantId: string,
    dto:          AcceptOrderDto,
    staffId:      string,
  ): Promise<KitchenActionResponseDto> {
    const order = await this.kitchenRepo.findOrderById(orderId, restaurantId);
    if (!order) throw new KitchenOrderNotFoundException(orderId);
    if (order.status !== 'PENDING') {
      throw new InvalidKitchenStatusTransitionException(order.status, 'CONFIRMED');
    }

    await this.kitchenRepo.acceptOrder(orderId, dto.estimatedPrepTime, staffId);

    this.emitter.emit(
      KitchenOrderAcceptedEvent.EVENT,
      new KitchenOrderAcceptedEvent(orderId, restaurantId, order.userId, dto.estimatedPrepTime),
    );

    this.logger.log(`Order ${orderId} ACCEPTED prepTime=${dto.estimatedPrepTime}min by=${staffId}`);

    return {
      orderId,
      status:           'CONFIRMED',
      message:          `Order accepted. Estimated preparation: ${dto.estimatedPrepTime} minutes.`,
      estimatedPrepTime: dto.estimatedPrepTime,
    };
  }

  // ── POST /kitchen/orders/:id/reject ───────────────────────────────────────

  async rejectOrder(
    orderId:      string,
    restaurantId: string,
    dto:          RejectOrderDto,
    staffId:      string,
  ): Promise<KitchenActionResponseDto> {
    const order = await this.kitchenRepo.findOrderById(orderId, restaurantId);
    if (!order) throw new KitchenOrderNotFoundException(orderId);
    if (order.status !== 'PENDING') {
      throw new InvalidKitchenStatusTransitionException(order.status, 'CANCELLED');
    }

    await this.kitchenRepo.rejectOrder(orderId, dto.reason, staffId);

    this.emitter.emit(
      KitchenOrderRejectedEvent.EVENT,
      new KitchenOrderRejectedEvent(orderId, restaurantId, order.userId, dto.reason),
    );

    this.logger.log(`Order ${orderId} REJECTED reason="${dto.reason}" by=${staffId}`);

    return {
      orderId,
      status:           'CANCELLED',
      message:          'Order rejected and customer has been notified.',
      estimatedPrepTime: null,
    };
  }

  // ── PATCH /kitchen/orders/:id/preparing ───────────────────────────────────

  async markPreparing(
    orderId:      string,
    restaurantId: string,
    staffId:      string,
  ): Promise<KitchenActionResponseDto> {
    const order = await this.kitchenRepo.findOrderById(orderId, restaurantId);
    if (!order) throw new KitchenOrderNotFoundException(orderId);
    if (order.status !== 'CONFIRMED') throw new OrderNotConfirmedException();

    await this.kitchenRepo.markPreparing(orderId, staffId);

    this.emitter.emit(
      KitchenOrderPreparingEvent.EVENT,
      new KitchenOrderPreparingEvent(orderId, restaurantId, order.userId),
    );

    this.logger.log(`Order ${orderId} → PREPARING by=${staffId}`);

    return {
      orderId,
      status:           'PREPARING',
      message:          'Kitchen is now preparing this order.',
      estimatedPrepTime: order.estimatedPrepTime,
    };
  }

  // ── PATCH /kitchen/orders/:id/ready ──────────────────────────────────────

  async markReady(
    orderId:      string,
    restaurantId: string,
    staffId:      string,
  ): Promise<KitchenActionResponseDto> {
    const order = await this.kitchenRepo.findOrderById(orderId, restaurantId);
    if (!order) throw new KitchenOrderNotFoundException(orderId);
    if (order.status !== 'PREPARING') throw new OrderNotPreparingException();

    await this.kitchenRepo.markReady(orderId, staffId);

    this.emitter.emit(
      KitchenOrderReadyEvent.EVENT,
      new KitchenOrderReadyEvent(orderId, restaurantId, order.userId),
    );

    this.logger.log(`Order ${orderId} → READY_FOR_PICKUP by=${staffId}`);

    return {
      orderId,
      status:           'READY_FOR_PICKUP',
      message:          'Order is ready for pickup.',
      estimatedPrepTime: order.estimatedPrepTime,
    };
  }

  // ── PATCH /kitchen/orders/:id/prep-time ───────────────────────────────────

  async updatePrepTime(
    orderId:      string,
    restaurantId: string,
    dto:          UpdatePrepTimeDto,
    staffId:      string,
  ): Promise<KitchenActionResponseDto> {
    const order = await this.kitchenRepo.findOrderById(orderId, restaurantId);
    if (!order) throw new KitchenOrderNotFoundException(orderId);

    await this.kitchenRepo.updatePrepTime(
      orderId, dto.estimatedPrepTime, staffId, dto.note,
    );

    this.emitter.emit(
      KitchenPrepTimeUpdatedEvent.EVENT,
      new KitchenPrepTimeUpdatedEvent(orderId, restaurantId, dto.estimatedPrepTime, staffId),
    );

    return {
      orderId,
      status:           order.status,
      message:          `Prep time updated to ${dto.estimatedPrepTime} minutes.`,
      estimatedPrepTime: dto.estimatedPrepTime,
    };
  }

  // ── PATCH /kitchen/status ─────────────────────────────────────────────────

  async changeRestaurantStatus(
    restaurantId: string,
    dto:          ChangeKitchenStatusDto,
    staffId:      string,
  ): Promise<{ status: string; message: string }> {
    await this.prisma.restaurant.update({
      where: { id: restaurantId },
      data:  {
        status:      dto.status as any,
        pausedUntil: dto.autoResumeAt ? new Date(dto.autoResumeAt) : null,
      },
    });

    // Log to availability log
    await (this.prisma as any).restaurantAvailability.create({
      data: {
        restaurantId,
        status:      dto.status,
        reason:      dto.reason,
        changedById: staffId,
        autoResumeAt: dto.autoResumeAt ? new Date(dto.autoResumeAt) : null,
      },
    });

    this.emitter.emit(
      KitchenStatusChangedEvent.EVENT,
      new KitchenStatusChangedEvent(restaurantId, dto.status, dto.reason, staffId),
    );

    this.logger.log(`Restaurant ${restaurantId} status → ${dto.status} by=${staffId}`);

    const messages: Record<string, string> = {
      OPEN:   'Restaurant is now open and accepting orders.',
      CLOSED: 'Restaurant is now closed.',
      BUSY:   'Restaurant marked as busy — estimated wait time increased.',
      PAUSED: 'Restaurant has paused new orders temporarily.',
    };

    return { status: dto.status, message: messages[dto.status] ?? 'Status updated.' };
  }

  // ── Private mapper ────────────────────────────────────────────────────────

  private toResponse(order: any): KitchenOrderResponseDto {
    return {
      id:                  order.id,
      orderNumber:         order.orderNumber,
      status:              order.status,
      estimatedPrepTime:   order.estimatedPrepTime ?? null,
      specialInstructions: order.specialInstructions ?? null,
      placedAt:            order.placedAt,
      confirmedAt:         order.confirmedAt ?? null,
      preparingAt:         order.preparingAt ?? null,
      customer: order.user
        ? { name: order.user.name, phone: order.user.phone ?? null }
        : null,
      items: (order.items ?? []).map((i: any) => ({
        id:             i.id,
        name:           i.name,
        quantity:       i.quantity,
        lineTotal:      Number(i.lineTotal),
        notes:          i.notes ?? null,
        customizations: i.customizations ?? null,
      })),
    };
  }
}