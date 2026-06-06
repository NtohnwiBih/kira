import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'generated/prisma/client';
import { AuthTokenPair, JwtPayload } from '../interfaces';
import { RedisSessionManager } from './redis-session.manager';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { generateSecureToken, generateJti, hashToken } from '../utils/crypto.utils';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { InvalidTokenException } from '../exceptions/auth.exceptions';

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redis: RedisSessionManager,
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {}

  /**
   * Generate Access + Refresh Token Pair
   */
  async generateTokenPair(user: User, deviceInfo?: any): Promise<AuthTokenPair> {
    const jti = generateJti();

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      jti,
      twoFactorVerified: user.isTwoFactorEnabled ? false : true, // if 2FA enabled, require verification
    };

    // Generate Access Token (Short-lived)
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_IN,
      algorithm: AUTH_CONSTANTS.JWT_ALGORITHM,
    });

    // Generate Refresh Token (Long-lived + stored hashed)
    const { raw: refreshToken, hash: refreshTokenHash } = generateSecureToken(
      AUTH_CONSTANTS.REFRESH_TOKEN_BYTES,
    );

    const now = Date.now();
    const accessTokenExpiresAt = now + AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_MS;
    const refreshTokenExpiresAt = now + AUTH_CONSTANTS.REFRESH_TOKEN_EXPIRES_MS;

    // Store Refresh Token in Database
    await this.refreshTokenRepo.create({
      userId: user.id,
      tokenHash: refreshTokenHash,
      deviceId: deviceInfo?.deviceId,
      deviceName: deviceInfo?.deviceName,
      ipAddress: deviceInfo?.ipAddress,
      userAgent: deviceInfo?.userAgent,
      expiresAt: new Date(refreshTokenExpiresAt),
      isRevoked: false,
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  /**
   * Blacklist Access Token (used on logout / password change)
   */
  async blacklistToken(jti: string): Promise<void> {
    const ttl = Math.floor(AUTH_CONSTANTS.ACCESS_TOKEN_EXPIRES_MS / 1000);
    await this.redis.blacklistToken(jti, ttl);
    this.logger.debug(`Token blacklisted: jti=${jti}`);
  }

  /**
   * Revoke a specific Refresh Token
   */
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await this.refreshTokenRepo.revoke(tokenHash);
  }

  /**
   * Revoke ALL Refresh Tokens for a User (used on password change, logout all devices)
   */
  async revokeAllRefreshTokensForUser(userId: string): Promise<void> {
    await this.refreshTokenRepo.revokeAllForUser(userId);
    this.logger.log(`All refresh tokens revoked for user: ${userId}`);
  }

  /**
   * Validate Refresh Token (used by Refresh Strategy)
   */
  async validateRefreshToken(tokenHash: string) {
    const record = await this.refreshTokenRepo.findValidByHash(tokenHash);

    if (!record) {
      throw new InvalidTokenException('Refresh token is invalid or expired');
    }

    return record;
  }

  /**
   * Helper: Revoke Refresh Token for User (used in logout)
   */
  async revokeRefreshTokenForUser(userId: string): Promise<void> {
    await this.revokeAllRefreshTokensForUser(userId);
  }
}