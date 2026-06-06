import { Injectable } from '@nestjs/common';
import * as speakeasy from 'speakeasy';
import * as qrcode from 'qrcode';
import { RedisSessionManager } from './redis-session.manager';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { TwoFactorNotEnabledException } from '../exceptions/auth.exceptions';

@Injectable()
export class TwoFaService {
  constructor(private redis: RedisSessionManager) {}

  async setupTwoFactor(userId: string) {
    const secret = speakeasy.generateSecret({
      name: 'Kira App',
      length: 20,
    });

    await this.redis.savePendingTotpSecret(userId, secret.base32);

    const otpauthUrl = secret.otpauth_url!;
    const qrCode = await qrcode.toDataURL(otpauthUrl);

    return {
      secret: secret.base32,
      otpauthUrl,
      qrCode,
    };
  }

  async verifyTwoFactor(userId: string, code: string): Promise<boolean> {
    const pendingSecret = await this.redis.getPendingTotpSecret(userId);
    if (!pendingSecret) throw new TwoFactorNotEnabledException();

    const isValid = speakeasy.totp.verify({
      secret: pendingSecret,
      encoding: 'base32',
      token: code,
      window: AUTH_CONSTANTS.TOTP_WINDOW,
    });

    if (isValid) {
      await this.redis.deletePendingTotpSecret(userId);
      // TODO: Save secret to user table
    }

    return isValid;
  }
}