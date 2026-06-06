import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';

import { RestaurantRepository }    from '../repositories/restaurant.repository';
import { PrismaService }           from 'src/database/prisma/prisma.service';

import {
  CreateRestaurantDto,
  UpdateRestaurantDto,
  ChangeAvailabilityDto,
  RestaurantResponseDto,
} from '../dto/restaurant.dto';

import {
  RestaurantCreatedEvent,
  AvailabilityChangedEvent,
  OnboardingStepCompletedEvent,
} from '../events/restaurant.events';

import {
  RestaurantNotFoundException,
} from '../exceptions/restaurant.exceptions';

import { RestaurantStatus } from 'generated/prisma/client';
import { OpeningHoursRepository } from '../repositories/opening-hours.repository';
import { generateUniqueSlug } from '../utils/slug.utils';
import { ONBOARDING_STEP, RESTAURANT_CONSTANTS } from '../constants/restaurant.contant';
import { isRestaurantOpenNow } from '../utils/opening-hour.utils';

@Injectable()
export class RestaurantService {
  private readonly logger = new Logger(RestaurantService.name);

  constructor(
    private readonly restaurantRepo: RestaurantRepository,
    private readonly hoursRepo:      OpeningHoursRepository,
    private readonly emitter:        EventEmitter2,
    private readonly config:         ConfigService,
    private readonly prisma:         PrismaService,
  ) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(
    dto:    CreateRestaurantDto,
    userId: string,
  ): Promise<RestaurantResponseDto> {
    const slug = await generateUniqueSlug(dto.name, this.restaurantRepo);

    const restaurant = await this.restaurantRepo.create({
      name:               dto.name,
      slug,
      description:        dto.description,
      phone:              dto.phone,
      email:              dto.email,
      address:            dto.address,
      city:               dto.city,
      lat:                dto.lat,
      lng:                dto.lng,
      cuisineTypes:       dto.cuisineTypes,
      defaultPrepTime:    dto.defaultPrepTime ?? RESTAURANT_CONSTANTS.PREP_TIME_DEFAULT_MINUTES,
      deliveryRadius:     dto.deliveryRadius,
      minimumOrderAmount: dto.minimumOrderAmount,
      ownerId:            userId,
      createdById:        userId,
      tags:               [],
      keywords:           [],
    } as any);

    this.emitter.emit(
      RestaurantCreatedEvent.EVENT,
      new RestaurantCreatedEvent(
        restaurant.id,
        userId,
        restaurant.name,
        restaurant.city,
      ),
    );

    this.logger.log(`Restaurant created id=${restaurant.id} owner=${userId}`);
    return this.mapToResponse(restaurant);
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<RestaurantResponseDto> {
    const r = await this.restaurantRepo.findById(id);
    if (!r) throw new RestaurantNotFoundException(id);
    return this.mapToResponse(r);
  }

  async findByOwner(ownerId: string): Promise<RestaurantResponseDto[]> {
    const list = await this.restaurantRepo.findByOwner(ownerId);
    return list.map((r) => this.mapToResponse(r));
  }

  async findMany(params: { city?: string; page: number; limit: number }) {
    return this.restaurantRepo.findMany({
      ...params,
      status: 'OPEN' as RestaurantStatus,
    });
  }

  // ── Update ─────────────────────────────────────────────────────────────────

  async update(
    id:      string,
    dto:     UpdateRestaurantDto,
    userId:  string,
  ): Promise<RestaurantResponseDto> {
    const existing = await this.restaurantRepo.findById(id);
    if (!existing) throw new RestaurantNotFoundException(id);

    // Re-slug only if name actually changed
    let slug = existing.slug;
    if (dto.name && dto.name !== existing.name) {
      slug = await generateUniqueSlug(dto.name, this.restaurantRepo);
    }

    const updated = await this.restaurantRepo.update(id, {
      ...dto,
      slug,
    } as any);

    this.logger.log(`Restaurant updated id=${id} by=${userId}`);
    return this.mapToResponse(updated);
  }

  // ── Availability ────────────────────────────────────────────────────────────

  async changeAvailability(
    id:      string,
    dto:     ChangeAvailabilityDto,
    userId:  string,
  ): Promise<{ status: RestaurantStatus; message: string }> {
    const restaurant = await this.restaurantRepo.findById(id);
    if (!restaurant) throw new RestaurantNotFoundException(id);

    const oldStatus = (restaurant as any).status ?? 'CLOSED';

    await this.restaurantRepo.updateStatus(id, dto.status);

    // Append to immutable availability log
    await (this.prisma as any).restaurantAvailability.create({
      data: {
        restaurantId:   id,
        status:         dto.status,
        previousStatus: oldStatus,
        reason:         dto.reason,
        changedById:    userId,
        autoResumeAt:   dto.autoResumeAt ? new Date(dto.autoResumeAt) : null,
      },
    });

    this.emitter.emit(
      AvailabilityChangedEvent.EVENT,
      new AvailabilityChangedEvent(id, dto.status, oldStatus, userId, dto.reason),
    );

    this.logger.log(
      `Restaurant ${id} status: ${oldStatus} → ${dto.status} by=${userId}`,
    );

    const messages: Record<string, string> = {
      OPEN:   'Restaurant is now open and accepting orders.',
      CLOSED: 'Restaurant is now closed.',
      BUSY:   'Restaurant is busy — estimated wait time increased.',
      PAUSED: 'Restaurant has paused new orders temporarily.',
    };

    return { status: dto.status, message: messages[dto.status] };
  }

  // ── Is open right now ───────────────────────────────────────────────────────

  async isOpenNow(id: string): Promise<boolean> {
    const restaurant = await this.restaurantRepo.findById(id);
    if (!restaurant) throw new RestaurantNotFoundException(id);

    // If status is not OPEN, skip the hours check entirely
    const status = (restaurant as any).status ?? 'CLOSED';
    if (status !== 'OPEN') return false;

    const hours = await this.hoursRepo.findByRestaurant(id);
    return isRestaurantOpenNow(hours as any);
  }

  // ── Soft-delete ─────────────────────────────────────────────────────────────
  // ✅  This was the method missing from the previous version.

  async softDelete(id: string): Promise<void> {
    const existing = await this.restaurantRepo.findById(id);
    if (!existing) throw new RestaurantNotFoundException(id);
    await this.restaurantRepo.softDelete(id);
    this.logger.warn(`Restaurant soft-deleted id=${id}`);
  }

  // ── Onboarding ──────────────────────────────────────────────────────────────

  async advanceOnboarding(id: string, step: number): Promise<void> {
    const r = await this.restaurantRepo.findById(id);
    // Only advance forward — never regress the step counter
    const currentStep = (r as any)?.onboardingStep ?? 0;
    if (!r || step <= currentStep) return;

    await this.restaurantRepo.incrementOnboardingStep(id, step);

    const stepNames = Object.entries(ONBOARDING_STEP)
      .sort(([, a], [, b]) => (a as number) - (b as number))
      .map(([name]) => name);

    const completedName = stepNames[step - 1] ?? 'UNKNOWN';
    const nextName      = stepNames[step]     ?? null;

    this.emitter.emit(
      OnboardingStepCompletedEvent.EVENT,
      new OnboardingStepCompletedEvent(
        id,
        r.ownerId,
        completedName,
        nextName,
        step >= 5,
      ),
    );
  }

  // ── Private mapper ──────────────────────────────────────────────────────────

  private mapToResponse(r: any): RestaurantResponseDto {
    return {
      id:                  r.id,
      name:                r.name,
      slug:                r.slug,
      description:         r.description ?? undefined,
      logoUrl:             r.logoUrl     ?? undefined,
      coverUrl:            r.coverUrl    ?? undefined,
      phone:               r.phone,
      email:               r.email,
      address:             r.address,
      city:                r.city,
      lat:                 r.lat        ?? undefined,
      lng:                 r.lng        ?? undefined,
      cuisineTypes:        r.cuisineTypes ?? [],
      defaultPrepTime:     r.defaultPrepTime ?? 20,
      status:              r.status         ?? 'CLOSED',
      verificationStatus:  r.verificationStatus ?? 'PENDING',
      isVerified:          r.isVerified      ?? false,
      onboardingStep:      r.onboardingStep  ?? 0,
      onboardingCompleted: r.onboardingCompleted ?? false,
      createdAt:           r.createdAt,
    };
  }
}