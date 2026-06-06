import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector }    from '@nestjs/core';
import { InsufficientManagerPermissionsException } from '../exceptions/restaurant.exceptions';
import { UserRole } from 'generated/prisma/client';
 
export const PERMISSION_KEY = 'requiredPermission';
 
@Injectable()
export class ManagerPermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
 
  canActivate(ctx: ExecutionContext): boolean {
    const permission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
 
    if (!permission) return true;
 
    const req  = ctx.switchToHttp().getRequest();
    const user = req.user;
 
    // Platform admins bypass
    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) return true;
 
    const context = req.restaurantContext;
 
    // Restaurant owners have all permissions
    if (context?.isOwner) return true;
 
    const perms = context?.permissions as Record<string, boolean> | undefined;
    if (!perms?.[permission]) {
      throw new InsufficientManagerPermissionsException(permission);
    }
 
    return true;
  }
}
