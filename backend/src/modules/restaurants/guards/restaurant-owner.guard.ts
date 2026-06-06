import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  RestaurantNotFoundException,
  RestaurantOwnershipException,
  ManagerSuspendedException,
} from '../exceptions/restaurant.exceptions';
import { UserRole } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
 
/** Attach with @UseGuards(RestaurantOwnershipGuard) on any controller that has :restaurantId */
@Injectable()
export class RestaurantOwnershipGuard implements CanActivate {
  private readonly logger = new Logger(RestaurantOwnershipGuard.name);
 
  constructor(private readonly prisma: PrismaService) {}
 
  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const req          = ctx.switchToHttp().getRequest();
    const user         = req.user; // set by JwtAuthGuard
    const restaurantId = req.params.restaurantId ?? req.params.id;
 
    if (!restaurantId) return true; // no restaurant context — skip
 
    // Platform admins bypass ownership checks
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }
 
    const restaurant = await this.prisma.restaurant.findUnique({
      where:  { id: restaurantId, deletedAt: null },
      select: { id: true, ownerId: true },
    });
 
    if (!restaurant) throw new RestaurantNotFoundException(restaurantId);
 
    // Owner always has access
    if (restaurant.ownerId === user.id) {
      req.restaurantContext = { restaurantId, isOwner: true, managerRole: null };
      return true;
    }
 
    // Check manager membership
    const manager = await this.prisma.restaurantManager.findFirst({
      where: {
        restaurantId,
        userId:    user.id,
        isActive:  true,
        deletedAt: null,
      },
    });
 
    if (!manager) throw new RestaurantOwnershipException();
    if (manager.isSuspended) throw new ManagerSuspendedException();
 
    // Attach manager context for downstream permission checks
    req.restaurantContext = {
      restaurantId,
      isOwner:     false,
      managerRole: manager.role,
      permissions: manager.permissions,
      managerId:   manager.id,
    };
 
    return true;
  }
}