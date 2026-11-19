import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SlackBuilderService } from './slack/slack-builder.service';
import { NotificationAuthGuard } from './notification-auth.guard';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, SlackBuilderService, NotificationAuthGuard],
  exports: [NotificationsService],
})
export class NotificationsModule {}
