import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailer: MailerService) {}

  async sendVerificationEmail(email: string, name: string, code: string): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Your Kira verification code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #f97316;">Welcome to Kira, ${name}!</h2>
            <p>Use the code below to verify your email address:</p>
            <div style="text-align: center; margin: 32px 0;">
              <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #1f2937;">
                ${code}
              </span>
            </div>
            <p style="color: #6b7280;">This code expires in <strong>24 hours</strong>.</p>
            <p style="color: #6b7280;">If you didn't create a Kira account, you can safely ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Verification code sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error);
      throw error;
    }
  }

  async sendPasswordResetEmail(email: string, name: string, code: string): Promise<void> {
    try {
      await this.mailer.sendMail({
        to: email,
        subject: 'Your Kira password reset code',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #f97316;">Password Reset Request</h2>
            <p>Hi ${name}, use the code below to reset your password:</p>
            <div style="text-align: center; margin: 32px 0;">
              <span style="font-size: 48px; font-weight: bold; letter-spacing: 12px; color: #1f2937;">
                ${code}
              </span>
            </div>
            <p style="color: #6b7280;">This code expires in <strong>1 hour</strong>.</p>
            <p style="color: #6b7280;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
      this.logger.log(`Password reset code sent to ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error);
      throw error;
    }
  }
}