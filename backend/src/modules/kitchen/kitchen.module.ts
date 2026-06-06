import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/database/prisma/prisma.module';
import { KitchenController } from './controllers/kitchen.controller';
import { KitchenRepository } from './repositories/kitchen.repository';
import { KitchenService } from './services/kitchen.service';

@Module({
  imports: [PrismaModule],
  controllers: [KitchenController],
  providers: [KitchenService, KitchenRepository], 
  exports: [KitchenService],
})
export class KitchenModule {}