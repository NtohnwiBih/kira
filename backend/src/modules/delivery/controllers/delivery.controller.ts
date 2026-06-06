import {
  Controller, Post, Patch, Get, Body, Param, ParseUUIDPipe,
  HttpCode, HttpStatus, UseGuards, UsePipes, ValidationPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser }  from '../../auth/decorators';
import { DeliveryService, AssignDriverDto, UpdateLocationDto, DeliveredDto } from '../services/delivery.service';
 
@ApiTags('Delivery')
@ApiBearerAuth('BearerAuth')
@UseGuards(JwtAuthGuard)
@Controller('delivery')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }))
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}
 
  @Post('assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Assign a driver to a ready order (Admin/Dispatcher)' })
  assign(@Body() dto: AssignDriverDto) {
    return this.deliveryService.assignDriver(dto);
  }
 
  @Get(':orderId/tracking')
  @ApiOperation({ summary: 'Get real-time delivery tracking for an order' })
  @ApiParam({ name: 'orderId' })
  getTracking(@Param('orderId', ParseUUIDPipe) orderId: string) {
    return this.deliveryService.getTracking(orderId);
  }
 
  @Patch(':orderId/pickup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Driver confirms order pickup' })
  @ApiParam({ name: 'orderId' })
  confirmPickup(@Param('orderId', ParseUUIDPipe) orderId: string, @CurrentUser() user: any) {
    return this.deliveryService.confirmPickup(orderId, user.id);
  }
 
  @Patch(':orderId/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Driver updates their GPS location (called every ~10s)' })
  @ApiParam({ name: 'orderId' })
  updateLocation(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: UpdateLocationDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.updateLocation(orderId, user.id, dto);
  }
 
  @Patch(':orderId/delivered')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Driver marks order as delivered' })
  @ApiParam({ name: 'orderId' })
  markDelivered(
    @Param('orderId', ParseUUIDPipe) orderId: string,
    @Body() dto: DeliveredDto,
    @CurrentUser() user: any,
  ) {
    return this.deliveryService.markDelivered(orderId, user.id, dto);
  }
}