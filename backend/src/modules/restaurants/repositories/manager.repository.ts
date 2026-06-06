import { Injectable } from '@nestjs/common';
import { PrismaService }   from 'src/database/prisma/prisma.service';

// ── Type aliases (available after prisma generate) ────────────────────────────
// Replace `any` with the real generated types once the client is regenerated:
//   import { Prisma, RestaurantManager } from 'generated/prisma/client';
//   type CreateInput = Prisma.RestaurantManagerCreateInput;
//   type UpdateInput = Prisma.RestaurantManagerUpdateInput;
type RestaurantManager = any;  // → replace with: import { RestaurantManager }
type CreateInput       = any;  // → replace with: Prisma.RestaurantManagerCreateInput
type UpdateInput       = any;  // → replace with: Prisma.RestaurantManagerUpdateInput

@Injectable()
export class ManagerRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Shortcut — avoids repeating `(this.prisma as any).restaurantManager` everywhere
  // Remove the cast after `npx prisma generate`
  private get db() {
    return (this.prisma as any).restaurantManager;
  }

  // ── Create ─────────────────────────────────────────────────────────────────

  async create(data: CreateInput): Promise<RestaurantManager> {
    return this.db.create({ data });
  }

  // ── Read ───────────────────────────────────────────────────────────────────

  async findById(id: string): Promise<RestaurantManager | null> {
    return this.db.findUnique({ where: { id } });
  }

  async findByRestaurantAndUser(
    restaurantId: string,
    userId: string,
  ): Promise<RestaurantManager | null> {
    return this.db.findFirst({
      where: { restaurantId, userId, deletedAt: null },
    });
  }

  async findByInviteToken(token: string): Promise<RestaurantManager | null> {
    return this.db.findUnique({ where: { inviteToken: token } });
  }

  async findByInviteEmail(
    restaurantId: string,
    email: string,
  ): Promise<RestaurantManager | null> {
    return this.db.findFirst({
      where: { restaurantId, inviteEmail: email, deletedAt: null },
    });
  }

  async findAllByRestaurant(restaurantId: string): Promise<RestaurantManager[]> {
    return this.db.findMany({
      where:   { restaurantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByRestaurant(restaurantId: string): Promise<number> {
    return this.db.count({ where: { restaurantId, deletedAt: null } });
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  async update(id: string, data: UpdateInput): Promise<RestaurantManager> {
    return this.db.update({ where: { id }, data });
  }

  async acceptInvite(
    token:  string,
    userId: string,
  ): Promise<RestaurantManager> {
    return this.db.update({
      where: { inviteToken: token },
      data:  {
        userId,
        isActive:        true,
        inviteToken:     null,
        inviteExpiry:    null,
        inviteAcceptedAt: new Date(),
      },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db.update({
      where: { id },
      data:  { deletedAt: new Date(), isActive: false },
    });
  }
}