import { Injectable } from '@nestjs/common';
import { RedisSessionManager } from './redis-session.manager';
import { AUTH_CONSTANTS } from '../constants/auth.constants';

@Injectable()
export class AccountLockService {
  constructor(private redis: RedisSessionManager) {}

  async recordFailedAttempt(userId: string): Promise<number> {
    return this.redis.recordFailedLogin(userId);
  }

  async isLocked(userId: string): Promise<boolean> {
    const attempts = await this.redis.getRateLimitCount(userId, 'failed-logins');
    return attempts >= AUTH_CONSTANTS.MAX_FAILED_LOGIN_ATTEMPTS;
  }

  async clearAttempts(userId: string) {
    await this.redis.clearFailedLogins(userId);
  }
}