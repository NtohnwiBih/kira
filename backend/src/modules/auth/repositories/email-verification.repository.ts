import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class EmailVerificationRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.emailVerification.create({ data });
  }

  async findValidToken(tokenHash: string) {
    return this.prisma.emailVerification.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });
  }

  async findValidTokenForUser(userId: string, tokenHash: string) {
    return this.prisma.emailVerification.findFirst({
      where: {
        userId,
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });
  }

  async invalidateAllForUser(userId: string) {
    return this.prisma.emailVerification.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });
  }

  async markAsUsed(tokenHash: string) {
    return this.prisma.emailVerification.updateMany({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
  }
}