import { Module } from '@nestjs/common';
import { NotificationService } from './services/notification.service';
import { PrismaModule } from 'src/database/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}