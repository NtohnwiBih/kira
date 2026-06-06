import { Module } from '@nestjs/common';
import { DeliveryController } from './controllers/delivery.controller';
import { DeliveryService } from './services/delivery.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService],
})
export class DeliveryModule {}