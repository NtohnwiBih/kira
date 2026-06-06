import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { UserRole } from 'generated/prisma/client';
import { InsufficientPermissionsException } from '../exceptions/auth.exceptions';
 
@Injectable()
export class ResourceOwnerGuard implements CanActivate {
  /**
   * @param idParam - the route param name that holds the owner userId
   *                  e.g. 'userId' for /users/:userId
   */
  constructor(private readonly idParam = 'userId') {}
 
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const user = req.user;
 
    // Admins may always access any resource
    if (
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.ADMIN
    ) return true;
 
    const resourceOwnerId = req.params[this.idParam];
    if (user.id !== resourceOwnerId) throw new InsufficientPermissionsException();
 
    return true;
  }
}