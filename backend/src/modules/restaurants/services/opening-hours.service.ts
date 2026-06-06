import { Injectable, Logger } from '@nestjs/common';
import { OpeningHoursRepository, RestaurantRepository }  from '../repositories';
import { BulkSetOpeningHoursDto, SetOpeningHourDto } from '../dto/restaurant.dto';
import { RestaurantNotFoundException } from '../exceptions/restaurant.exceptions';
import { RestaurantService } from './restaurant.service';
import { validateNoOverlap, validateShift } from '../utils/opening-hour.utils';
import { ONBOARDING_STEP } from '../constants/restaurant.contant';
 
@Injectable()
export class OpeningHoursService {
  private readonly logger = new Logger(OpeningHoursService.name);
 
  constructor(
    private readonly hoursRepo:       OpeningHoursRepository,
    private readonly restaurantRepo:  RestaurantRepository,
    private readonly restaurantSvc:   RestaurantService,
  ) {}
 
  async bulkSet(restaurantId: string, dto: BulkSetOpeningHoursDto) {
    const restaurant = await this.restaurantRepo.findById(restaurantId);
    if (!restaurant) throw new RestaurantNotFoundException(restaurantId);
 
    // Group by day and validate
    const byDay = new Map<string, SetOpeningHourDto[]>();
    for (const h of dto.hours) {
      const dayHours = byDay.get(h.dayOfWeek) ?? [];
      dayHours.push(h);
      byDay.set(h.dayOfWeek, dayHours);
    }
 
    for (const [day, shifts] of byDay) {
      for (const shift of shifts) {
        if (!shift.isClosed) {
          validateShift(shift.opensAt, shift.closesAt);
        }
      }
      validateNoOverlap(
        shifts
          .filter((s) => !s.isClosed)
          .map((s) => ({ opensAt: s.opensAt, closesAt: s.closesAt })),
      );
    }
 
    // Upsert all
    const results = await Promise.all(
      dto.hours.map((h) =>
        this.hoursRepo.upsert({
          restaurantId,
          dayOfWeek:  h.dayOfWeek,
          opensAt:    h.opensAt,
          closesAt:   h.closesAt,
          isClosed:   h.isClosed ?? false,
          shiftIndex: h.shiftIndex ?? 0,
        }),
      ),
    );
 
    // Advance onboarding
    await this.restaurantSvc.advanceOnboarding(restaurantId, ONBOARDING_STEP.OPENING_HOURS + 1);
 
    this.logger.log(`Opening hours updated for restaurant=${restaurantId}`);
    return results;
  }
 
  async get(restaurantId: string) {
    return this.hoursRepo.findByRestaurant(restaurantId);
  }
}