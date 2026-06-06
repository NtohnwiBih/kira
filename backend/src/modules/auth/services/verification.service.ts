import { Injectable, Logger } from '@nestjs/common';
import { EmailVerificationRepository } from '../repositories/email-verification.repository';
import { UserRepository } from '../repositories/user.repository';
import { MailService } from '../../mail/mail.service';
import { hashToken } from '../utils/crypto.utils';
import { AUTH_CONSTANTS } from '../constants/auth.constants';
import { InvalidTokenException } from '../exceptions/auth.exceptions';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    private readonly emailVerificationRepo: EmailVerificationRepository,
    private readonly userRepo: UserRepository,
    private readonly mailService: MailService,
  ) {}

  private generateSixDigitCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendVerificationEmail(userId: string, email: string): Promise<void> {
    // Invalidate any existing unused codes for this user
    await this.emailVerificationRepo.invalidateAllForUser(userId);

    const code = this.generateSixDigitCode();
    const hash = hashToken(code);

    await this.emailVerificationRepo.create({
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + AUTH_CONSTANTS.EMAIL_VERIFICATION_EXPIRES_MS),
    });

    const user = await this.userRepo.findById(userId);
    const name = user?.name ?? 'there';

    await this.mailService.sendVerificationEmail(email, name, code);
    this.logger.log(`Verification code sent to ${email}`);
  }

  async verifyEmail(email: string, code: string): Promise<void> {
    const user = await this.userRepo.findByEmail(email);
    if (!user) throw new InvalidTokenException('Invalid or expired verification code');

    if (user.isVerified) {
      throw new InvalidTokenException('Email is already verified');
    }

    const hash = hashToken(code);
    const record = await this.emailVerificationRepo.findValidTokenForUser(user.id, hash);

    if (!record) {
      throw new InvalidTokenException('Invalid or expired verification code');
    }

    await this.userRepo.markEmailAsVerified(user.id);
    await this.emailVerificationRepo.markAsUsed(hash);
  }
}