import { Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { ARGON2_OPTIONS } from '../constants/auth.constants';
 
@Injectable()
export class PasswordService {
  private readonly logger = new Logger(PasswordService.name);
 
  /**
   * Hashes a plaintext password using Argon2id.
   * Argon2id is resistant to both side-channel and GPU-based attacks.
   */
  async hash(plaintext: string): Promise<string> {
    return argon2.hash(plaintext, {
      type:        argon2.argon2id,
      memoryCost:  ARGON2_OPTIONS.memoryCost,
      timeCost:    ARGON2_OPTIONS.timeCost,
      parallelism: ARGON2_OPTIONS.parallelism,
    });
  }
 
  /**
   * Timing-safe comparison via argon2.verify.
   * Never use === on password strings.
   */
  async verify(plaintext: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plaintext);
    } catch (err) {
      this.logger.error('argon2.verify threw unexpectedly', err);
      return false;
    }
  }
}