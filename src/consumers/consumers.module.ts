import { Module } from '@nestjs/common';
import { NotificationConsumer } from './notification.consumer';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  providers: [NotificationConsumer],
})
export class ConsumersModule {}
