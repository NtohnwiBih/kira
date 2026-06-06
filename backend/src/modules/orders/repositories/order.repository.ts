import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

const ORDER_INCLUDE = {
  items:    true,
  payment:  true,
  restaurant: {
    select: {
      id:      true,
      name:    true,
      phone:   true,
      logoUrl: true,
    },
  },
  address: true,
  driver: {
    select: {
      id:          true,
      vehiclePlate: true,
      vehicleType:  true,
      user:         { select: { name: true, phone: true } },
    },
  },
  statusHistory: {
    orderBy: { createdAt: 'desc' as const },
    take:    20,
  },
} as const;

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Reads ──────────────────────────────────────────────────────────────────

  async findById(id: string) {
    return this.prisma.order.findUnique({
      where:   { id },
      include: ORDER_INCLUDE,
    });
  }

  async findByIdAndUser(id: string, userId: string) {
    return this.prisma.order.findFirst({
      where:   { id, userId },
      include: ORDER_INCLUDE,
    });
  }

  async findByUser(userId: string, page: number, limit: number) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where:   { userId },
        include: {
          restaurant: { select: { name: true } },
          items:       { select: { quantity: true } },
        },
        orderBy: { placedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.order.count({ where: { userId } }),
    ]);
    return { data, total };
  }

  async findByRestaurant(restaurantId: string, page: number, limit: number) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where:   { restaurantId },
        include: ORDER_INCLUDE,
        orderBy: { placedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.order.count({ where: { restaurantId } }),
    ]);
    return { data, total };
  }

  async findAll(page: number, limit: number) {
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        include: ORDER_INCLUDE,
        orderBy: { placedAt: 'desc' },
        skip:    (page - 1) * limit,
        take:    limit,
      }),
      this.prisma.order.count(),
    ]);
    return { data, total };
  }

  // ── Order number generation ────────────────────────────────────────────────

  async generateOrderNumber(): Promise<string> {
    const date  = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const count = await this.prisma.order.count();
    const seq   = String(count + 1).padStart(4, '0');
    return `KIRA-${date}-${seq}`;
  }

  // ── Status ────────────────────────────────────────────────────────────────

  async updateStatus(id: string, status: string, extra?: Record<string, unknown>) {
    return this.prisma.order.update({
      where:   { id },
      data:    { status: status as any, ...extra },
      include: ORDER_INCLUDE,
    });
  }

  async appendStatusHistory(
    orderId:      string,
    status:       string,
    changedById?: string,
    note?:        string,
  ) {
    return this.prisma.orderStatusHistory.create({
      data: {
        orderId,
        status:      status as any,
        changedById,
        note,
      },
    });
  }
}