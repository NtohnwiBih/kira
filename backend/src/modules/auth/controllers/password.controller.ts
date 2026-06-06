import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { ForgotPasswordDto, ResetPasswordDto, ChangePasswordDto } from '../dto';
import { JwtAuthGuard } from '../guards';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { CurrentUser } from '../decorators';

@Controller('auth/password')
export class PasswordController {
  constructor(private readonly authService: AuthService) {}

  @Post('forgot')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('change')
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, dto);
  }
}