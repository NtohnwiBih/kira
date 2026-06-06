import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard }             from '../../auth/guards/jwt-auth.guard';
import { CurrentUser }       from '../../auth/decorators';
import type { AuthenticatedUser }        from '../../auth/interfaces';

import { ManagerService }           from '../services/manager.service';
import {
  InviteManagerDto,
  UpdateManagerRoleDto,
  SuspendManagerDto,
  ManagerResponseDto,
  MessageResponseDto,
} from '../dto/restaurant.dto';
import { RequiresPermission } from '../decorators/restaurant.decorators';
import { RestaurantOwnershipGuard } from '../guards/restaurant-owner.guard';
import { ManagerPermissionGuard } from '../guards/manager-permission.guard';

@ApiTags('Restaurant Managers')
@ApiBearerAuth('BearerAuth')
@Controller('restaurants/:restaurantId/managers')
@UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class ManagerController {
  constructor(private readonly managerService: ManagerService) {}

  // ── POST /restaurants/:restaurantId/managers ──────────────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequiresPermission('canManageStaff')
  @ApiOperation({
    summary: 'Invite a manager',
    description:
      'Sends an invite to the given email. The invited user receives a link to ' +
      'accept and set up their account. Roles: `RESTAURANT_MANAGER`, ' +
      '`KITCHEN_MANAGER`, `CASHIER`. Default permissions are assigned by role; ' +
      'pass `customPermissions` to override individual flags.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiResponse({ status: 201, description: 'Invite sent', schema: { example: { message: 'Invitation sent to chef@kira.cm.', managerId: 'uuid' } } })
  @ApiResponse({ status: 403, description: 'canManageStaff permission required' })
  @ApiResponse({ status: 409, description: 'Manager with this email already exists' })
  async invite(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: InviteManagerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.managerService.invite(restaurantId, dto, user.id);
  }

  // ── GET /restaurants/:restaurantId/managers ───────────────────────────────
  @Get()
  @ApiOperation({ summary: 'List all managers for a restaurant' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiResponse({ status: 200, type: [ManagerResponseDto] })
  async list(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ): Promise<ManagerResponseDto[]> {
    return this.managerService.getManagers(restaurantId) as any;
  }

  // ── PATCH /restaurants/:restaurantId/managers/:managerId/role ─────────────
  @Patch(':managerId/role')
  @RequiresPermission('canManageStaff')
  @ApiOperation({
    summary: 'Change a manager\'s role',
    description: 'Replaces the manager\'s role and resets permissions to the role defaults.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'managerId',    description: 'Manager UUID' })
  @ApiResponse({ status: 200, type: ManagerResponseDto })
  @ApiResponse({ status: 403, description: 'canManageStaff permission required' })
  @ApiResponse({ status: 404, description: 'Manager not found' })
  async updateRole(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('managerId',    ParseUUIDPipe) managerId: string,
    @Body() dto: UpdateManagerRoleDto,
  ) {
    return this.managerService.updateRole(managerId, restaurantId, dto);
  }

  // ── PATCH /restaurants/:restaurantId/managers/:managerId/suspend ──────────
  @Patch(':managerId/suspend')
  @RequiresPermission('canManageStaff')
  @ApiOperation({
    summary: 'Suspend a manager',
    description:
      'Blocks the manager from accessing the restaurant dashboard. ' +
      'The manager record is preserved — use `/reinstate` to restore access. ' +
      'A manager cannot suspend themselves.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'managerId',    description: 'Manager UUID' })
  @ApiResponse({ status: 200, description: 'Manager suspended' })
  @ApiResponse({ status: 400, description: 'Cannot self-suspend' })
  async suspend(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('managerId',    ParseUUIDPipe) managerId: string,
    @Body() dto: SuspendManagerDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.managerService.suspend(managerId, restaurantId, dto, user.id);
  }

  // ── PATCH /restaurants/:restaurantId/managers/:managerId/reinstate ─────────
  @Patch(':managerId/reinstate')
  @RequiresPermission('canManageStaff')
  @ApiOperation({ summary: 'Lift a manager suspension and restore access' })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'managerId',    description: 'Manager UUID' })
  @ApiResponse({ status: 200, description: 'Manager reinstated' })
  async reinstate(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('managerId',    ParseUUIDPipe) managerId: string,
  ) {
    return this.managerService.reinstate(managerId, restaurantId);
  }

  // ── DELETE /restaurants/:restaurantId/managers/:managerId ─────────────────
  @Delete(':managerId')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('canManageStaff')
  @ApiOperation({
    summary: 'Revoke manager access permanently',
    description: 'Soft-deletes the manager record. The user account is unaffected.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'managerId',    description: 'Manager UUID' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  async revoke(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('managerId',    ParseUUIDPipe) managerId: string,
  ): Promise<MessageResponseDto> {
    return this.managerService.revoke(managerId, restaurantId);
  }
}