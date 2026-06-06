import { SetMetadata, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { PERMISSION_KEY } from '../guards/manager-permission.guard';
 
/**
 * Attaches a required manager permission name to the route handler.
 * Must be used with ManagerPermissionGuard.
 *
 * Usage: @RequiresPermission('canEditMenu')
 */
export const RequiresPermission = (permission: string) =>
  SetMetadata(PERMISSION_KEY, permission);
 
/**
 * Extracts the restaurant context object set by RestaurantOwnershipGuard.
 * Usage: @RestaurantCtx() ctx: RestaurantContext
 */
export interface RestaurantContext {
  restaurantId:  string;
  isOwner:       boolean;
  managerRole:   string | null;
  permissions?:  Record<string, boolean>;
  managerId?:    string;
}
 
export const RestaurantCtx = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RestaurantContext => {
    return ctx.switchToHttp().getRequest().restaurantContext;
  },
);
 
/**
 * Extracts the :restaurantId route param.
 * Usage: @RestaurantId() id: string
 */
export const RestaurantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const req = ctx.switchToHttp().getRequest();
    return req.params.restaurantId ?? req.params.id;
  },
);
 