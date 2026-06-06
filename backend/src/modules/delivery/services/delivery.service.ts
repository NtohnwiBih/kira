import {
  Injectable, Logger, NotFoundException, BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PrismaService } from 'src/database/prisma/prisma.service';
import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
 
export class AssignDriverDto {
  @ApiProperty({ example: 'driver-uuid' })
  driverId: string;
  @ApiProperty({ example: 'order-uuid' })
  orderId: string;
}
export class UpdateLocationDto {
  @ApiProperty({ example: 3.867 }) @IsNumber() lat: number;
  @ApiProperty({ example: 11.517 }) @IsNumber() lng: number;
}
export class DeliveredDto {
  @ApiPropertyOptional() @IsOptional() @IsString() notes?: string;
}
 
@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);
 
  constructor(
    private readonly prisma:  PrismaService,
    private readonly emitter: EventEmitter2,
  ) {}
 
  async assignDriver(dto: AssignDriverDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) throw new NotFoundException('Order not found.');
    if (order.status !== 'READY_FOR_PICKUP') throw new BadRequestException('Order must be READY_FOR_PICKUP to assign a driver.');
 
    const driver = await this.prisma.deliveryDriver.findUnique({ where: { id: dto.driverId } });
    if (!driver) throw new NotFoundException('Driver not found.');
    if ((driver as any).status !== 'ONLINE') throw new BadRequestException('Driver is not available.');
 
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: dto.orderId },
        data:  { driverId: dto.driverId, status: 'PICKED_UP' as any },
      }),
      this.prisma.deliveryDriver.update({
        where: { id: dto.driverId },
        data:  { status: 'ON_DELIVERY' as any },
      }),
      (this.prisma as any).deliveryTracking.create({
        data: {
          orderId:    dto.orderId,
          driverId:   dto.driverId,
          status:     'DRIVER_ASSIGNED',
          assignedAt: new Date(),
        },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId: dto.orderId, status: 'PICKED_UP' as any, changedById: dto.driverId },
      }),
    ]);
 
    this.emitter.emit('driver.assigned', { orderId: dto.orderId, driverId: dto.driverId });
    this.logger.log(`Driver ${dto.driverId} assigned to order ${dto.orderId}`);
    return { orderId: dto.orderId, driverId: dto.driverId, status: 'DRIVER_ASSIGNED' };
  }
 
  async confirmPickup(orderId: string, driverId: string) {
    const tracking = await (this.prisma as any).deliveryTracking.findUnique({ where: { orderId } });
    if (!tracking || tracking.driverId !== driverId) throw new ForbiddenException();
 
    await (this.prisma as any).deliveryTracking.update({
      where: { orderId },
      data:  { status: 'PICKED_UP', pickedUpAt: new Date() },
    });
    await this.prisma.order.update({
      where: { id: orderId },
      data:  { status: 'PICKED_UP' as any, pickedUpAt: new Date() },
    });
    this.emitter.emit('order.picked_up', { orderId, driverId });
    return { orderId, status: 'PICKED_UP' };
  }
 
  async updateLocation(orderId: string, driverId: string, dto: UpdateLocationDto) {
    const db = this.prisma as any;
    await db.deliveryTracking.update({
      where: { orderId },
      data:  { currentLat: dto.lat, currentLng: dto.lng, lastLocationAt: new Date() },
    });
    await db.deliveryLocationHistory.create({
      data: {
        trackingId: (await db.deliveryTracking.findUnique({ where: { orderId }, select: { id: true } })).id,
        lat: dto.lat, lng: dto.lng,
      },
    });
    this.emitter.emit('driver.location_updated', { orderId, driverId, lat: dto.lat, lng: dto.lng });
    return { updated: true };
  }
 
  async markDelivered(orderId: string, driverId: string, dto: DeliveredDto) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, driverId } });
    if (!order) throw new NotFoundException('Order not found.');
 
    await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data:  { status: 'DELIVERED' as any, deliveredAt: new Date() },
      }),
      this.prisma.deliveryDriver.update({
        where: { id: driverId },
        data:  { status: 'ONLINE' as any, totalDeliveries: { increment: 1 } },
      }),
      (this.prisma as any).deliveryTracking.update({
        where: { orderId },
        data:  { status: 'DELIVERED', deliveredAt: new Date(), notes: dto.notes },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId, status: 'DELIVERED' as any, changedById: driverId },
      }),
    ]);
 
    this.emitter.emit('order.delivered', { orderId, driverId, userId: order.userId });
    this.logger.log(`Order ${orderId} DELIVERED by driver ${driverId}`);
    return { orderId, status: 'DELIVERED' };
  }
 
  async getTracking(orderId: string) {
    return (this.prisma as any).deliveryTracking.findUnique({
      where:   { orderId },
      include: {
        driver: { include: { user: { select: { name: true, phone: true } } } },
        locationHistory: { orderBy: { recordedAt: 'desc' }, take: 50 },
      },
    });
  }
}