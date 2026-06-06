import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'generated/prisma/client';
 
export const ROLES_KEY = 'roles';
 
/**
 * Attach required roles to a route handler.
 * Usage: @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);