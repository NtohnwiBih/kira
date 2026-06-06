import { Injectable } from '@nestjs/common';
import { RestaurantPaymentMethod, PaymentProvider, Prisma, RestaurantPaymentProvider } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
 
@Injectable()
export class PaymentMethodRepository {
  constructor(private readonly prisma: PrismaService) {}
 
  async create(data: Prisma.RestaurantPaymentMethodCreateInput): Promise<RestaurantPaymentMethod> {
    return this.prisma.restaurantPaymentMethod.create({ data });
  }
 
  async findById(id: string, restaurantId: string): Promise<RestaurantPaymentMethod | null> {
    return this.prisma.restaurantPaymentMethod.findFirst({
      where: { id, restaurantId, deletedAt: null },
    });
  }
 
  async findByRestaurant(restaurantId: string): Promise<RestaurantPaymentMethod[]> {
    return this.prisma.restaurantPaymentMethod.findMany({
      where:   { restaurantId, deletedAt: null, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
    });
  }
 
  async findByHash(
    restaurantId: string,
    provider: RestaurantPaymentProvider,
    hash: string,
  ): Promise<RestaurantPaymentMethod | null> {
    return this.prisma.restaurantPaymentMethod.findFirst({
      where: { restaurantId, provider, accountNumberHash: hash, deletedAt: null },
    });
  }
 
  async unsetPrimary(restaurantId: string, provider: RestaurantPaymentProvider): Promise<void> {
    await this.prisma.restaurantPaymentMethod.updateMany({
      where: { restaurantId, provider, isPrimary: true },
      data:  { isPrimary: false },
    });
  }
 
  async update(id: string, data: Prisma.RestaurantPaymentMethodUpdateInput): Promise<RestaurantPaymentMethod> {
    return this.prisma.restaurantPaymentMethod.update({ where: { id }, data });
  }
 
  async softDelete(id: string): Promise<void> {
    await this.prisma.restaurantPaymentMethod.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
  }
 
  async countActive(restaurantId: string): Promise<number> {
    return this.prisma.restaurantPaymentMethod.count({
      where: { restaurantId, isActive: true, deletedAt: null },
    });
  }
}