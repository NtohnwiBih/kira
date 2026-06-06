import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { UserRole }      from 'generated/prisma/client';
import { OrderNotBelongsToRestaurantException } from '../exceptions/kitchen.exceptions';

@Injectable()
export class KitchenRestaurantGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req  = ctx.switchToHttp().getRequest();
    const user = req.user;

    if (!user) return false;

    // Platform admins bypass restaurant checks
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    // Find the restaurant this user owns
    const restaurant = await this.prisma.restaurant.findFirst({
      where:  { ownerId: user.id, deletedAt: null, isActive: true },
      select: { id: true },
    });

    // Also check if the user is a manager for some restaurant
    const managerRecord = !restaurant
      ? await (this.prisma as any).restaurantManager.findFirst({
          where:  { userId: user.id, isActive: true, isSuspended: false, deletedAt: null },
          select: { restaurantId: true },
        })
      : null;

    const restaurantId = restaurant?.id ?? managerRecord?.restaurantId;

    if (!restaurantId) throw new OrderNotBelongsToRestaurantException();

    // Attach for downstream use so services don't re-query
    req.user.restaurantId = restaurantId;
    return true;
  }
}