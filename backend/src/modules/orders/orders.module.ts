import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService }    from './services/order.service';
import { OrderRepository } from './repositories/order.repository';
import { CartModule }      from '../cart/cart.module';
import { PrismaModule }    from 'src/database/prisma/prisma.module';
 
@Module({
  imports:     [PrismaModule, CartModule],
  controllers: [OrderController],
  providers:   [OrderService, OrderRepository],
  exports:     [OrderService],
})
export class OrdersModule {}