import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { CurrentUser } from '../decorators';
import { TwoFaService } from '../services/twofa.service';
import { TwoFaVerifyDto } from '../dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth/2fa')
@UseGuards(JwtAuthGuard)
export class TwoFaController {
  constructor(private readonly twoFaService: TwoFaService) {}

  @Post('setup')
  @ApiBearerAuth()
  async setup(@CurrentUser() user: AuthenticatedUser) {
    return this.twoFaService.setupTwoFactor(user.id);
  }

  @Post('verify')
  @ApiBearerAuth()
  async verify(@CurrentUser() user: AuthenticatedUser, @Body() dto: TwoFaVerifyDto) {
    return this.twoFaService.verifyTwoFactor(user.id, dto.code);
  }
}