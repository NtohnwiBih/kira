import { Module } from '@nestjs/common';
import { PrismaModule }       from 'src/database/prisma/prisma.module';
import { AiGatewayController } from './controllers/ai-gateway.controller';
import { AiGatewayService }    from './services/ai-gateway.service';
 
@Module({
  imports:     [PrismaModule],
  controllers: [AiGatewayController],
  providers:   [AiGatewayService],
  exports:     [AiGatewayService],
})
export class AiGatewayModule {}