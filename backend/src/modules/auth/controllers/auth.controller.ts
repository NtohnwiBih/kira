import { Controller, Post, Body, Req, Res, Get, UseGuards, HttpCode } from '@nestjs/common';
import type { Response } from 'express';
import type { Request } from 'express';
import { AuthService } from '../services/auth.service';
import { RegisterDto, LoginDto } from '../dto';
import { JwtAuthGuard, RefreshTokenGuard } from '../guards';
import { CurrentUser, DeviceInfoParam, ClientIp, Public } from '../decorators';
import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new customer' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiBody({ type: RegisterDto })
  async register(
    @Body() dto: RegisterDto,
    @ClientIp() ip: string,
    @DeviceInfoParam() deviceInfo: any,
  ) {
    return this.authService.register(dto, ip, deviceInfo);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  async login(
    @Body() dto: LoginDto,
    @ClientIp() ip: string,
    @Req() req: Request,
  ) {
    return this.authService.login(dto, ip, req.headers['user-agent'] || '');
  }

  @Post('refresh')
  @UseGuards(RefreshTokenGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Req() req: Request) {
    const userId = (req.user as any).userId;
    const tokenHash = (req.user as any).tokenHash;
    return this.authService.refreshTokens(userId, tokenHash);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Logout current session' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: Response,
  ) {
    await this.authService.logout(user.id, user.jti);
    res.clearCookie('kira_refresh_token');
    res.clearCookie('kira_access_token');
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('BearerAuth')
  @ApiOperation({ summary: 'Get current authenticated user' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.getMe(user.id);
  }
}