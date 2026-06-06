import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma/prisma.service';

@Injectable()
export class AuditLogRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.auditLog.create({ data });
  }
}