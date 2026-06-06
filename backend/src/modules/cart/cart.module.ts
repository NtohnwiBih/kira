import { Module } from '@nestjs/common';
import { CartController } from './controllers/cart.controller';
import { CartService }    from './services/cart.service';
import { CartRepository } from './repositories/cart.repository';
import { PrismaModule }   from 'src/database/prisma/prisma.module';
 
@Module({
  imports:     [PrismaModule],
  controllers: [CartController],
  providers:   [CartService, CartRepository],
  exports:     [CartService],
})
export class CartModule {}