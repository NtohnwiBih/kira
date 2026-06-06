import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

const KITCHEN_ORDER_INCLUDE = {
  items: {
    orderBy: { id: 'asc' as const },
  },
  user: {
    select: { id: true, name: true, phone: true },
  },
} as const;

@Injectable()
export class KitchenRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Queries ────────────────────────────────────────────────────────────────

  async findActiveOrders(restaurantId: string) {
    return this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as any },
      },
      include: KITCHEN_ORDER_INCLUDE,
      orderBy: { placedAt: 'asc' },
    });
  }

  async findOrderById(orderId: string, restaurantId: string) {
    return this.prisma.order.findFirst({
      where:   { id: orderId, restaurantId },
      include: KITCHEN_ORDER_INCLUDE,
    });
  }

  async findOrdersByStatus(restaurantId: string, status: string) {
    return this.prisma.order.findMany({
      where:   { restaurantId, status: status as any },
      include: KITCHEN_ORDER_INCLUDE,
      orderBy: { placedAt: 'asc' },
    });
  }

  // ── Workload summary ───────────────────────────────────────────────────────

  async getWorkloadSummary(restaurantId: string) {
    const counts = await this.prisma.order.groupBy({
      by:    ['status'],
      where: {
        restaurantId,
        status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_PICKUP'] as any },
      },
      _count: { id: true },
    });

    const avgResult = await this.prisma.order.aggregate({
      where:  { restaurantId, status: 'DELIVERED' as any, estimatedPrepTime: { not: null } },
      _avg:   { estimatedPrepTime: true },
    });

    return { counts, avgPrepTime: avgResult._avg.estimatedPrepTime ?? 0 };
  }

  // ── Mutations ──────────────────────────────────────────────────────────────

  async acceptOrder(
    orderId:           string,
    estimatedPrepTime: number,
    changedById:       string,
  ) {
    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status:            'CONFIRMED' as any,
          estimatedPrepTime,
          confirmedAt:       new Date(),
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status:      'CONFIRMED' as any,
          changedById,
          note:        `Accepted. Est. prep time: ${estimatedPrepTime} min`,
        },
      }),
    ]);
  }

  async rejectOrder(orderId: string, reason: string, changedById: string) {
    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: {
          status:        'CANCELLED' as any,
          cancelReason:  reason,
          cancelledById: changedById,
          cancelledAt:   new Date(),
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status:      'CANCELLED' as any,
          changedById,
          note:        `Rejected by restaurant: ${reason}`,
        },
      }),
    ]);
  }

  async markPreparing(orderId: string, changedById: string) {
    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data:  { status: 'PREPARING' as any, preparingAt: new Date() },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId, status: 'PREPARING' as any, changedById },
      }),
    ]);
  }

  async markReady(orderId: string, changedById: string) {
    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data:  { status: 'READY_FOR_PICKUP' as any, readyAt: new Date() },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId, status: 'READY_FOR_PICKUP' as any, changedById },
      }),
    ]);
  }

  async updatePrepTime(
    orderId:           string,
    estimatedPrepTime: number,
    changedById:       string,
    note?:             string,
  ) {
    return this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data:  { estimatedPrepTime },
      }),
      this.prisma.orderStatusHistory.create({
        data: {
          orderId,
          status:      'PREPARING' as any,
          changedById,
          note:        note ?? `Prep time updated to ${estimatedPrepTime} min`,
        },
      }),
    ]);
  }
}