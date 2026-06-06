import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class SessionRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.userSession.create({ data });
  }

  async findById(sessionId: string) {
    return this.prisma.userSession.findUnique({ where: { id: sessionId } });
  }

  async findActiveByUserId(userId: string) {
    return this.prisma.userSession.findMany({
      where: { userId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(sessionId: string, userId: string) {
    return this.prisma.userSession.updateMany({
      where: { id: sessionId, userId },
      data: { isActive: false },
    });
  }

  async revokeAll(userId: string) {
    return this.prisma.userSession.updateMany({
      where: { userId },
      data: { isActive: false },
    });
  }
}