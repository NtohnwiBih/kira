import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto';
import { Public } from '../decorators';

@Controller('auth/admin')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async adminLogin(@Body() dto: LoginDto) {
    return this.authService.login(dto, '0.0.0.0', 'Admin Login');
  }
}