import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { VerifyEmailDto, ResendVerificationDto } from '../dto';
import { Public } from '../decorators';

@Controller('auth/verification')
export class VerificationController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post('resend')
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerification(dto);
  }
}