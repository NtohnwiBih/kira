import { Controller, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { CurrentUser } from '../decorators';
import { SessionService } from '../services/session.service';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('auth/sessions')
@UseGuards(JwtAuthGuard)
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get()
  @ApiBearerAuth('BearerAuth')
  async getSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.sessionService.getUserSessions(user.id);
  }

  @Delete(':id')
  @ApiBearerAuth('BearerAuth')
  async revokeSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') sessionId: string,
  ) {
    return this.sessionService.revokeSession(sessionId, user.id);
  }
}