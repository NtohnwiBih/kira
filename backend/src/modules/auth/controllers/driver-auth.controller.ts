import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterDriverDto } from '../dto';
import { Public } from '../decorators';

@Controller('auth/driver')
export class DriverAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async registerDriver(@Body() dto: RegisterDriverDto) {
    return this.authService.registerDriver(dto);
  }
}