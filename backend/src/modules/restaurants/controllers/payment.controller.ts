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
import { CurrentUser }              from '../../auth/decorators';
import type { AuthenticatedUser }        from '../../auth/interfaces';

import { RestaurantOwnershipGuard } from '../guards/restaurant-owner.guard';
import { ManagerPermissionGuard } from '../guards/manager-permission.guard';
import { RequiresPermission } from '../decorators/restaurant.decorators';

import { PaymentService }           from '../services/payment.service';
import {
  AddPaymentMethodDto,
  PaymentMethodResponseDto,
  MessageResponseDto,
} from '../dto/restaurant.dto';

@ApiTags('Restaurant Payments')
@ApiBearerAuth('BearerAuth')
@Controller('restaurants/:restaurantId/payment-methods')
@UseGuards(JwtAuthGuard, RestaurantOwnershipGuard, ManagerPermissionGuard)
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  // ── POST /restaurants/:restaurantId/payment-methods ───────────────────────
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @RequiresPermission('canManagePayments')
  @ApiOperation({
    summary: 'Add a Mobile Money collection account',
    description:
      'Adds an MTN MOMO or Orange Money account number for receiving customer payments. ' +
      'The number is AES-256-GCM encrypted at rest. Only the SHA-256 hash is stored ' +
      'in plain text for duplicate detection. API responses show only the masked tail.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiResponse({ status: 201, type: PaymentMethodResponseDto })
  @ApiResponse({ status: 403, description: 'canManagePayments permission required' })
  @ApiResponse({ status: 409, description: 'This number is already registered' })
  async add(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: AddPaymentMethodDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentService.add(restaurantId, dto, user.id);
  }

  // ── GET /restaurants/:restaurantId/payment-methods ────────────────────────
  @Get()
  @ApiOperation({
    summary: 'List active payment methods',
    description: 'Returns masked account numbers only. Full numbers are never exposed via API.',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiResponse({ status: 200, type: [PaymentMethodResponseDto] })
  async list(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
  ): Promise<PaymentMethodResponseDto[]> {
    return this.paymentService.list(restaurantId);
  }

  // ── PATCH /restaurants/:restaurantId/payment-methods/:methodId/primary ────
  @Patch(':methodId/primary')
  @RequiresPermission('canManagePayments')
  @ApiOperation({
    summary: 'Set a payment method as primary',
    description:
      'Demotes any existing primary for the same provider then promotes this one. ' +
      'There can only be one primary per provider (MOMO / OM).',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'methodId',     description: 'Payment method UUID' })
  @ApiResponse({ status: 200, type: PaymentMethodResponseDto })
  async setPrimary(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('methodId',     ParseUUIDPipe) methodId: string,
  ): Promise<PaymentMethodResponseDto> {
    return this.paymentService.setPrimary(methodId, restaurantId);
  }

  // ── DELETE /restaurants/:restaurantId/payment-methods/:methodId ───────────
  @Delete(':methodId')
  @HttpCode(HttpStatus.OK)
  @RequiresPermission('canManagePayments')
  @ApiOperation({
    summary: 'Remove a payment method',
    description:
      'Soft-deletes the method. Blocked if it is the only active payment method ' +
      'or if it is the primary and another method exists (set a new primary first).',
  })
  @ApiParam({ name: 'restaurantId', description: 'Restaurant UUID' })
  @ApiParam({ name: 'methodId',     description: 'Payment method UUID' })
  @ApiResponse({ status: 200, type: MessageResponseDto })
  @ApiResponse({ status: 400, description: 'Cannot remove the primary / last method' })
  async remove(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('methodId',     ParseUUIDPipe) methodId: string,
  ): Promise<MessageResponseDto> {
    return this.paymentService.remove(methodId, restaurantId);
  }
}