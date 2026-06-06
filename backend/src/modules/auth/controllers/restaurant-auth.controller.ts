import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { RegisterRestaurantDto } from '../dto';
import { Public } from '../decorators';

@Controller('auth/restaurant')
export class RestaurantAuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  async registerRestaurant(@Body() dto: RegisterRestaurantDto) {
    return this.authService.registerRestaurant(dto);
  }
}