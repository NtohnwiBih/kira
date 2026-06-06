import { Injectable } from '@nestjs/common';
import { User } from 'generated/prisma/client';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findActiveById(id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { 
        id, 
        isActive: true 
      },
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  async markEmailAsVerified(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { 
        isVerified: true,
        lastLoginAt: new Date() 
      },
    });
  }

  async incrementFailedLogins(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { failedLoginCount: { increment: 1 } },
    });
  }

  async lockAccount(id: string, lockedUntil: Date): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { lockedUntil },
    });
  }

  async resetFailedLogins(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { failedLoginCount: 0, lockedUntil: null },
    });
  }
}