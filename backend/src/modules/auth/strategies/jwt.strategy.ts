import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy }                  from '@nestjs/passport';
import { ExtractJwt, Strategy }             from 'passport-jwt';
import { ConfigService }                    from '@nestjs/config';
import { AuthenticatedUser, JwtPayload } from '../interfaces';
import { RedisSessionManager } from '../services/redis-session.manager';
import { UserRepository } from '../repositories/user.repository';
import { REDIS_KEYS } from '../constants/auth.constants';
 
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisSessionManager,
    private readonly userRepo: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Try HttpOnly cookie first (browser clients)
        (req) => req?.cookies?.kira_access_token ?? null,
        // Fall back to Authorization: Bearer header (mobile / API)
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_PUBLIC_KEY') ?? '',
      algorithms: ['RS256'],
    });
  }
 
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // ── Replay / blacklist check ─────────────────────────────────────────────
    const blacklistKey = `${REDIS_KEYS.BLACKLISTED_TOKEN}${payload.jti}`;
    const isBlacklisted = await this.redis.exists(blacklistKey);
    if (isBlacklisted) {
      throw new UnauthorizedException('Token has been revoked.');
    }
 
    // ── Account still active ─────────────────────────────────────────────────
    // Lightweight projection — avoids full user hydration on every request
    const user = await this.userRepo.findActiveById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Account not found or has been deactivated.');
    }
 
    return {
      id:                 payload.sub,
      email:              payload.email,
      role:               payload.role,
      jti:                payload.jti,
      twoFactorVerified:  payload.twoFactorVerified ?? false,
    };
  }
}