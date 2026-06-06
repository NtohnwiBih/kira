import { Module } from '@nestjs/common';
import { PaymentController }  from './controllers/payment.controller';
import { PaymentService }     from './services/payment.service';
import { MtnMomoService }     from './services/mtn-momo.service';
import { OrangeMoneyService } from './services/orange-money.service';
import { PrismaModule }       from 'src/database/prisma/prisma.module';
 
@Module({
  imports:     [PrismaModule],
  controllers: [PaymentController],
  providers:   [PaymentService, MtnMomoService, OrangeMoneyService],
  exports:     [PaymentService],
})
export class PaymentsModule {}