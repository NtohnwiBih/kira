import { Injectable, Logger } from '@nestjs/common';
import { AuditLogRepository } from '../repositories/audit-log.repository';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepo: AuditLogRepository) {}

  log(action: string, userId: string | null, metadata: Record<string, any> = {}) {
    this.auditRepo.create({
      userId: userId || null,
      action,
      resource: 'AUTH',
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      metadata: metadata || {},
      status: 'SUCCESS',
    }).catch(err => this.logger.error(`Audit log failed: ${err.message}`));
  }

  logFailed(action: string, userId: string | null, reason: string) {
    this.auditRepo.create({
      userId: userId || null,
      action,
      resource: 'AUTH',
      metadata: { reason },
      status: 'FAILED',
    }).catch(err => this.logger.error(`Audit log failed: ${err.message}`));
  }
}