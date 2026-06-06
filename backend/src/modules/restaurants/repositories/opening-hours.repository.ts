import { Injectable } from '@nestjs/common';
import { RestaurantOpeningHour, DayOfWeek, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';
 
@Injectable()
export class OpeningHoursRepository {
  constructor(private readonly prisma: PrismaService) {}
 
  async upsert(data: {
    restaurantId: string;
    dayOfWeek:    DayOfWeek;
    opensAt:      string;
    closesAt:     string;
    isClosed:     boolean;
    shiftIndex:   number;
  }): Promise<RestaurantOpeningHour> {
    return this.prisma.restaurantOpeningHour.upsert({
      where: {
        restaurantId_dayOfWeek_shiftIndex: {
          restaurantId: data.restaurantId,
          dayOfWeek:    data.dayOfWeek,
          shiftIndex:   data.shiftIndex,
        },
      },
      create: data,
      update: { opensAt: data.opensAt, closesAt: data.closesAt, isClosed: data.isClosed },
    });
  }
 
  async findByRestaurant(restaurantId: string): Promise<RestaurantOpeningHour[]> {
    return this.prisma.restaurantOpeningHour.findMany({
      where:   { restaurantId },
      orderBy: [{ dayOfWeek: 'asc' }, { shiftIndex: 'asc' }],
    });
  }
 
  async findByDay(
    restaurantId: string,
    dayOfWeek:    DayOfWeek,
  ): Promise<RestaurantOpeningHour[]> {
    return this.prisma.restaurantOpeningHour.findMany({
      where: { restaurantId, dayOfWeek },
    });
  }
 
  async deleteByDay(restaurantId: string, dayOfWeek: DayOfWeek): Promise<void> {
    await this.prisma.restaurantOpeningHour.deleteMany({
      where: { restaurantId, dayOfWeek },
    });
  }
}