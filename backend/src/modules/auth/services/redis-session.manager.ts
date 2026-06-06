import { Injectable, Inject, Logger } from '@nestjs/common';
import Redis                          from 'ioredis';
import { REDIS_KEYS, AUTH_CONSTANTS } from '../constants/auth.constants';
import { SessionData }                from '../interfaces';
 
export const REDIS_CLIENT = 'REDIS_CLIENT';
 
@Injectable()
export class RedisSessionManager {
  private readonly logger = new Logger(RedisSessionManager.name);
 
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}
 
  // ── Generic helpers ─────────────────────────────────────────────────────────
 
  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, 'EX', ttlSeconds);
  }
 
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }
 
  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }
 
  async exists(key: string): Promise<boolean> {
    const result = await this.redis.exists(key);
    return result === 1;
  }
 
  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const count = await this.redis.incr(key);
    if (ttlSeconds && count === 1) {
      // Only set TTL on first increment — avoids resetting the window
      await this.redis.expire(key, ttlSeconds);
    }
    return count;
  }
 
  async ttl(key: string): Promise<number> {
    return this.redis.ttl(key);
  }
 
  // ── Access token blacklist ─────────────────────────────────────────────────
 
  /**
   * Blacklists a JWT by its JTI until the token's natural expiry.
   * This ensures logout / password-change immediately invalidates
   * outstanding access tokens without waiting for expiry.
   */
  async blacklistToken(jti: string, ttlSeconds: number): Promise<void> {
    const key = `${REDIS_KEYS.BLACKLISTED_TOKEN}${jti}`;
    await this.set(key, '1', ttlSeconds);
    this.logger.debug(`Blacklisted token jti=${jti}`);
  }
 
  async isTokenBlacklisted(jti: string): Promise<boolean> {
    return this.exists(`${REDIS_KEYS.BLACKLISTED_TOKEN}${jti}`);
  }
 
  // ── Session store ──────────────────────────────────────────────────────────
 
  async saveSession(sessionData: SessionData): Promise<void> {
    const key = `${REDIS_KEYS.SESSION}${sessionData.sessionId}`;
    await this.set(
      key,
      JSON.stringify(sessionData),
      Math.floor(AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_MS / 1000),
    );
 
    // Track session IDs per user (for bulk invalidation)
    await this.redis.sadd(
      `${REDIS_KEYS.USER_SESSIONS}${sessionData.userId}`,
      sessionData.sessionId,
    );
  }
 
  async getSession(sessionId: string): Promise<SessionData | null> {
    const raw = await this.get(`${REDIS_KEYS.SESSION}${sessionId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionData;
    } catch {
      return null;
    }
  }
 
  async deleteSession(sessionId: string, userId: string): Promise<void> {
    await this.del(`${REDIS_KEYS.SESSION}${sessionId}`);
    await this.redis.srem(`${REDIS_KEYS.USER_SESSIONS}${userId}`, sessionId);
  }
 
  /**
   * Invalidates ALL sessions for a user (force logout everywhere).
   * Called on password change / account lock / suspicious login.
   */
  async invalidateAllUserSessions(userId: string): Promise<void> {
    const setKey = `${REDIS_KEYS.USER_SESSIONS}${userId}`;
    const sessionIds = await this.redis.smembers(setKey);
 
    const pipeline = this.redis.pipeline();
    for (const id of sessionIds) {
      pipeline.del(`${REDIS_KEYS.SESSION}${id}`);
    }
    pipeline.del(setKey);
    await pipeline.exec();
 
    this.logger.log(`Invalidated ${sessionIds.length} sessions for userId=${userId}`);
  }
 
  // ── Rate limiting helpers ─────────────────────────────────────────────────
 
  async incrementRateLimit(
    identifier: string,
    action: string,
    windowSeconds: number,
  ): Promise<number> {
    const key = `${REDIS_KEYS.RATE_LIMIT}${action}:${identifier}`;
    return this.increment(key, windowSeconds);
  }
 
  async getRateLimitCount(identifier: string, action: string): Promise<number> {
    const key = `${REDIS_KEYS.RATE_LIMIT}${action}:${identifier}`;
    const val = await this.get(key);
    return val ? parseInt(val, 10) : 0;
  }
 
  // ── Failed login tracking ─────────────────────────────────────────────────
 
  async recordFailedLogin(userId: string): Promise<number> {
    const key = `${REDIS_KEYS.FAILED_LOGINS}${userId}`;
    // Keep failed-login counter for 30 minutes (the lock duration)
    return this.increment(
      key,
      Math.floor(AUTH_CONSTANTS.ACCOUNT_LOCK_DURATION_MS / 1000),
    );
  }
 
  async clearFailedLogins(userId: string): Promise<void> {
    await this.del(`${REDIS_KEYS.FAILED_LOGINS}${userId}`);
  }
 
  // ── TOTP pending setup ────────────────────────────────────────────────────
 
  async savePendingTotpSecret(userId: string, secret: string): Promise<void> {
    const key = `${REDIS_KEYS.TOTP_PENDING}${userId}`;
    await this.set(key, secret, AUTH_CONSTANTS.TOTP_PENDING_TTL_S);
  }
 
  async getPendingTotpSecret(userId: string): Promise<string | null> {
    return this.get(`${REDIS_KEYS.TOTP_PENDING}${userId}`);
  }
 
  async deletePendingTotpSecret(userId: string): Promise<void> {
    await this.del(`${REDIS_KEYS.TOTP_PENDING}${userId}`);
  }
}