import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

import { InvalidTokenException } from '../exceptions/auth.exceptions';
import { RefreshTokenRepository } from '../repositories/refresh-token.repository';
import { hashToken } from '../utils/crypto.utils';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import type { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class RefreshJwtStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(
    private readonly config: ConfigService,
    private readonly refreshTokenRepo: RefreshTokenRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) =>
          req?.cookies?.[AUTH_CONSTANTS.COOKIE_REFRESH_TOKEN] ??
          (req?.body as { refreshToken?: string })?.refreshToken ??
          null,
      ]),
      secretOrKey: config.get<string>('JWT_PUBLIC_KEY'),
      algorithms: ['RS256'],
      passReqToCallback: true,
      ignoreExpiration: false,
    } as any); // ← Fix: Type assertion to bypass strict overload
  }

  async validate(req: Request, payload: JwtPayload) {
    // Extract raw refresh token from cookie or body
    const rawToken: string =
      req.cookies?.[AUTH_CONSTANTS.COOKIE_REFRESH_TOKEN] ??
      (req.body as { refreshToken?: string })?.refreshToken;

    if (!rawToken) {
      throw new InvalidTokenException();
    }

    const tokenHash = hashToken(rawToken);
    const record = await this.refreshTokenRepo.findValidByHash(tokenHash);

    if (!record || record.isRevoked || record.expiresAt < new Date()) {
      throw new InvalidTokenException('Refresh token is invalid or has expired.');
    }

    return { 
      userId: payload.sub, 
      tokenHash, 
      record 
    };
  }
}