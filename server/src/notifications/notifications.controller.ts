import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  SendDeployNotificationDto,
  SendCiNotificationDto,
  SendCommunityNotificationDto,
} from './dto/notification.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(ApiKeyGuard)
@Controller('notifications/slack')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('deploy')
  @ApiOperation({ summary: 'Dispatch production deployment status alert to Slack' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async notifyDeploy(@Body() dto: SendDeployNotificationDto) {
    return this.notificationsService.sendDeployNotification(dto);
  }

  @Post('ci')
  @ApiOperation({ summary: 'Dispatch CI/CD pipeline breakdown alert to Slack' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async notifyCi(@Body() dto: SendCiNotificationDto) {
    return this.notificationsService.sendCiNotification(dto);
  }

  @Post('community')
  @ApiOperation({ summary: 'Dispatch community feedback or comment alert to Slack' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async notifyCommunity(@Body() dto: SendCommunityNotificationDto) {
    return this.notificationsService.sendCommunityNotification(dto);
  }
}
