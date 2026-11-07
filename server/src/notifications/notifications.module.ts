import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { SlackBuilderService } from './slack/slack-builder.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, SlackBuilderService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
