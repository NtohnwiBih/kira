import { Injectable } from '@nestjs/common';
import { SessionRepository } from '../repositories/session.repository';
import { RedisSessionManager } from './redis-session.manager';
import { SessionData } from '../interfaces/session.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepo: SessionRepository,
    private readonly redis: RedisSessionManager,
  ) {}

  async createSession(
    userId: string,
    deviceId: string,
    deviceName?: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<SessionData> {
    const sessionId = uuidv4();

    const sessionData: SessionData = {
      sessionId,
      userId,
      deviceId: deviceId || uuidv4(),
      deviceName,
      ipAddress,
      userAgent,
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      isActive: true,
    };

    // Save to PostgreSQL
    await this.sessionRepo.create({
      id: sessionId,
      userId,
      deviceId: sessionData.deviceId,
      deviceName,
      deviceType: null, // can be extended
      ipAddress,
      userAgent,
      location: null,
      isActive: true,
      lastSeenAt: new Date(),
    });

    // Save to Redis for fast access
    await this.redis.saveSession(sessionData);

    return sessionData;
  }

  async getUserSessions(userId: string) {
    return this.sessionRepo.findActiveByUserId(userId);
  }

  async revokeSession(sessionId: string, userId: string) {
    await this.sessionRepo.revoke(sessionId, userId);
    await this.redis.deleteSession(sessionId, userId);
  }

  async revokeAllUserSessions(userId: string) {
    await this.sessionRepo.revokeAll(userId);
    await this.redis.invalidateAllUserSessions(userId);
  }
}