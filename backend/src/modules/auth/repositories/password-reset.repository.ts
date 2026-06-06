import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class PasswordResetRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.passwordReset.create({ data });
  }

  async findValidToken(tokenHash: string) {
    return this.prisma.passwordReset.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: new Date() },
        usedAt: null,
      },
    });
  }

  async markAsUsed(tokenHash: string) {
    return this.prisma.passwordReset.updateMany({
      where: { tokenHash },
      data: { usedAt: new Date() },
    });
  }
}