import {
  Controller, Get, Post, Patch, Body, Param,
  ParseUUIDPipe, HttpCode, HttpStatus,
  UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiBearerAuth, ApiOperation,
  ApiParam, ApiResponse,
} from '@nestjs/swagger';

import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { RolesGuard }   from 'src/modules/auth/guards/roles.guard';
import { Roles, CurrentUser } from 'src/modules/auth/decorators';
import { UserRole }     from 'generated/prisma/client';

import { KitchenService }         from '../services/kitchen.service';
import { KitchenRestaurantGuard } from '../guards/kitchen-restaurant.guard';
import {
  AcceptOrderDto,
  RejectOrderDto,
  UpdatePrepTimeDto,
  ChangeKitchenStatusDto,
  KitchenOrderResponseDto,
  KitchenWorkloadDto,
  KitchenActionResponseDto,
} from '../dto/kitchen.dto';

@ApiTags('Kitchen')
@ApiBearerAuth('BearerAuth')
@UseGuards(JwtAuthGuard, RolesGuard, KitchenRestaurantGuard)
@Roles(
  UserRole.RESTAURANT_OWNER,
  UserRole.ADMIN,
  UserRole.SUPER_ADMIN,
)
@Controller('kitchen')
@UsePipes(
  new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
)
export class KitchenController {
  constructor(private readonly kitchenService: KitchenService) {}

  // ── GET /kitchen/orders ───────────────────────────────────────────────────
  @Get('orders')
  @ApiOperation({
    summary: 'Live kitchen order queue',
    description:
      'Returns all PENDING, CONFIRMED, PREPARING and READY_FOR_PICKUP orders ' +
      'for the authenticated restaurant, sorted by placement time (oldest first).',
  })
  @ApiResponse({ status: 200, type: [KitchenOrderResponseDto] })
  getOrders(@CurrentUser() user: any): Promise<KitchenOrderResponseDto[]> {
    return this.kitchenService.getActiveOrders(user.restaurantId ?? user.id);
  }

  // ── GET /kitchen/workload ─────────────────────────────────────────────────
  @Get('workload')
  @ApiOperation({ summary: 'Kitchen workload summary — order counts per status + average prep time' })
  @ApiResponse({ status: 200, type: KitchenWorkloadDto })
  getWorkload(@CurrentUser() user: any): Promise<KitchenWorkloadDto> {
    return this.kitchenService.getWorkload(user.restaurantId ?? user.id);
  }

  // ── POST /kitchen/orders/:id/accept ───────────────────────────────────────
  @Post('orders/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Accept an incoming order',
    description:
      'Transitions PENDING → CONFIRMED and sets the estimated prep time. ' +
      'Triggers a push notification to the customer.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: KitchenActionResponseDto })
  @ApiResponse({ status: 400, description: 'Order is not in PENDING status' })
  @ApiResponse({ status: 404, description: 'Order not found in this restaurant' })
  acceptOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptOrderDto,
    @CurrentUser() user: any,
  ): Promise<KitchenActionResponseDto> {
    return this.kitchenService.acceptOrder(
      id, user.restaurantId ?? user.id, dto, user.id,
    );
  }

  // ── POST /kitchen/orders/:id/reject ───────────────────────────────────────
  @Post('orders/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reject an incoming order',
    description:
      'Transitions PENDING → CANCELLED. ' +
      'A reason is required and is shown to the customer.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: KitchenActionResponseDto })
  rejectOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: any,
  ): Promise<KitchenActionResponseDto> {
    return this.kitchenService.rejectOrder(
      id, user.restaurantId ?? user.id, dto, user.id,
    );
  }

  // ── PATCH /kitchen/orders/:id/preparing ───────────────────────────────────
  @Patch('orders/:id/preparing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark order as PREPARING',
    description: 'Transitions CONFIRMED → PREPARING. Kitchen has started cooking.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: KitchenActionResponseDto })
  markPreparing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<KitchenActionResponseDto> {
    return this.kitchenService.markPreparing(
      id, user.restaurantId ?? user.id, user.id,
    );
  }

  // ── PATCH /kitchen/orders/:id/ready ──────────────────────────────────────
  @Patch('orders/:id/ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark order as READY_FOR_PICKUP',
    description:
      'Transitions PREPARING → READY_FOR_PICKUP. ' +
      'Triggers driver assignment flow and customer notification.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: KitchenActionResponseDto })
  markReady(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
  ): Promise<KitchenActionResponseDto> {
    return this.kitchenService.markReady(
      id, user.restaurantId ?? user.id, user.id,
    );
  }

  // ── PATCH /kitchen/orders/:id/prep-time ───────────────────────────────────
  @Patch('orders/:id/prep-time')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update estimated prep time for an active order',
    description: 'Can be called on any active order. Broadcasts new ETA to the customer.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID' })
  @ApiResponse({ status: 200, type: KitchenActionResponseDto })
  updatePrepTime(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePrepTimeDto,
    @CurrentUser() user: any,
  ): Promise<KitchenActionResponseDto> {
    return this.kitchenService.updatePrepTime(
      id, user.restaurantId ?? user.id, dto, user.id,
    );
  }

  // ── PATCH /kitchen/status ─────────────────────────────────────────────────
  @Patch('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change restaurant availability from the kitchen',
    description:
      'Allows kitchen staff to switch between OPEN / CLOSED / BUSY / PAUSED. ' +
      'PAUSED + autoResumeAt auto-reopens at the specified time.',
  })
  @ApiResponse({ status: 200, schema: { example: { status: 'BUSY', message: 'Restaurant marked as busy.' } } })
  changeStatus(
    @Body() dto: ChangeKitchenStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.kitchenService.changeRestaurantStatus(
      user.restaurantId ?? user.id, dto, user.id,
    );
  }
}