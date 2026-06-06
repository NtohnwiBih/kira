import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma/prisma.module';
import { MailModule } from '../mail/mail.module';

// Controllers
import { RestaurantController } from './controllers/restaurant.controller';
import { MenuController } from './controllers/menu.controllers';
import { ManagerController } from './controllers/manager.controller';
import { PaymentController } from './controllers/payment.controller';

// Services
import { RestaurantService } from './services/restaurant.service';
import { MenuService } from './services/menu.service';
import { ManagerService } from './services/manager.service';
import { PaymentService } from './services/payment.service';
import { OpeningHoursService } from './services/opening-hours.service';

// Repositories
import { ManagerRepository, OpeningHoursRepository, PaymentMethodRepository, RestaurantRepository } from './repositories';
import { MenuRepository } from './repositories';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [
    RestaurantController,
    MenuController,
    ManagerController,
    PaymentController,
  ],
  providers: [
    RestaurantService,
    MenuService,
    ManagerService,
    PaymentService,
    OpeningHoursService,
    RestaurantRepository,
    MenuRepository,
    ManagerRepository,
    OpeningHoursRepository,
    PaymentMethodRepository
  ],
  exports: [RestaurantService, MenuService],
})
export class RestaurantModule {}