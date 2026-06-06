import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector }  from '@nestjs/core';
import { UserRole } from 'generated/prisma/client';
import { ROLES_KEY }  from '../decorators';
import { InsufficientPermissionsException } from '../exceptions/auth.exceptions';
 
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
 
  canActivate(ctx: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
 
    // No @Roles() decorator — route is accessible by any authenticated user
    if (!requiredRoles?.length) return true;
 
    const { user } = ctx.switchToHttp().getRequest();
    if (!user) throw new InsufficientPermissionsException();
 
    const hasRole = requiredRoles.includes(user.role as UserRole);
    if (!hasRole) throw new InsufficientPermissionsException();
 
    return true;
  }
}