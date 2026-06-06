import { Injectable } from '@nestjs/common';
import { Prisma, Restaurant, RestaurantStatus, VerificationStatus } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class RestaurantRepository {
  constructor(private readonly prisma: PrismaService) {}

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(data: Prisma.RestaurantCreateInput): Promise<Restaurant> {
    return this.prisma.restaurant.create({ data });
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findUnique({
      where: { id, deletedAt: null },
    });
  }

  async findBySlug(slug: string): Promise<Restaurant | null> {
    return this.prisma.restaurant.findUnique({
      where: { slug, deletedAt: null },
    });
  }

  async findByOwner(ownerId: string): Promise<Restaurant[]> {
    return this.prisma.restaurant.findMany({
      where:   { ownerId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMany(params: {
    city?:   string;
    status?: RestaurantStatus;
    page:    number;
    limit:   number;
  }): Promise<{ data: Restaurant[]; total: number }> {
    const where: Prisma.RestaurantWhereInput = {
      deletedAt: null,
      isActive:  true,
      // city is an existing column — no cast needed
      ...(params.city && {
        city: { contains: params.city, mode: 'insensitive' as const },
      }),
      // status is a NEW column — cast until prisma generate runs
      ...(params.status && {
        ...(({ status: params.status } as unknown) as Prisma.RestaurantWhereInput),
      }),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.restaurant.findMany({
        where,
        skip:    (params.page - 1) * params.limit,
        take:    params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.restaurant.count({ where }),
    ]);

    return { data, total };
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.restaurant.count({ where: { slug } });
    return count > 0;
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  async update(id: string, data: Prisma.RestaurantUpdateInput): Promise<Restaurant> {
    return this.prisma.restaurant.update({ where: { id }, data });
  }

  /**
   * Updates the runtime status (OPEN | CLOSED | BUSY | PAUSED).
   *
   * `status` is a new column not yet in the stale generated client, so we
   * narrow to `Prisma.RestaurantUncheckedUpdateInput` which Prisma always
   * accepts for plain scalar updates.  Remove the cast after `prisma generate`.
   */
  async updateStatus(id: string, status: RestaurantStatus): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data:  { status } as Prisma.RestaurantUncheckedUpdateInput,
    });
  }

  /**
   * Updates `verificationStatus` + derives `isVerified` boolean.
   * Same cast reasoning as `updateStatus`.
   */
  async updateVerification(
    id:     string,
    status: VerificationStatus,
  ): Promise<Restaurant> {
    const isVerified = status === ('VERIFIED' as VerificationStatus);
    return this.prisma.restaurant.update({
      where: { id },
      data:  {
        verificationStatus: status,
        isVerified,
      } as Prisma.RestaurantUncheckedUpdateInput,
    });
  }

  /**
   * Advances the onboarding step counter and flips `onboardingCompleted`
   * when all 6 steps are done (step index 5 = payment method added).
   */
  async incrementOnboardingStep(id: string, step: number): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data:  {
        onboardingStep:      step,
        onboardingCompleted: step >= 5,
      } as Prisma.RestaurantUncheckedUpdateInput,
    });
  }

  async updateCurrentWaitTime(id: string, minutes: number): Promise<Restaurant> {
    return this.prisma.restaurant.update({
      where: { id },
      data:  {
        currentWaitTime: minutes,
      } as Prisma.RestaurantUncheckedUpdateInput,
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.restaurant.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
  }
}