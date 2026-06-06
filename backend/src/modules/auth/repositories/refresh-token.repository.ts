import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.refreshToken.create({ data });
  }

  async findValidByHash(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
    });
  }

  async revoke(tokenHash: string) {
    return this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { isRevoked: true },
    });
  }

  async revokeAllForUser(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }
}