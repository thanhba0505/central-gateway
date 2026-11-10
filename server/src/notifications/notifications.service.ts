import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlackBuilderService } from './slack/slack-builder.service';
import {
  SendDeployNotificationDto,
  SendCiNotificationDto,
  SendCommunityNotificationDto,
  SendTestNotificationDto,
  SendGitNotificationDto,
} from './dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly token = process.env.SLACK_BOT_TOKEN;

  constructor(
    private readonly prisma: PrismaService,
    private readonly slackBuilder: SlackBuilderService,
  ) {}

  private async getTargetChannel(projectSlug: string, eventType: string): Promise<string> {
    const mapping = await this.prisma.channelMapping.findFirst({
      where: {
        project: { slug: projectSlug },
        eventType,
      },
    });

    if (mapping) {
      return mapping.channelId;
    }

    throw new NotFoundException(
      `No channel mapped in DB for project '${projectSlug}' and event type '${eventType}'`,
    );
  }

  private async sendSlackApi(payload: Record<string, unknown>) {
    if (!this.token) {
      this.logger.warn('SLACK_BOT_TOKEN not configured. Skipped dispatch.');
      return { success: false, error: 'TOKEN_NOT_CONFIGURED' };
    }

    try {
      const resp = await fetch('https://slack.com/api/chat.postMessage', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = (await resp.json()) as Record<string, unknown>;
      return data;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error('Slack dispatch error', err);
      return { success: false, error: errMsg };
    }
  }

  async sendDeployNotification(dto: SendDeployNotificationDto) {
    const channelId = await this.getTargetChannel(dto.project, 'deploy');
    const payload = this.slackBuilder.buildDeployPayload(channelId, dto);
    return this.sendSlackApi(payload);
  }

  async sendCiNotification(dto: SendCiNotificationDto) {
    const channelId = await this.getTargetChannel(dto.project, 'ci');
    const payload = this.slackBuilder.buildCiPayload(channelId, dto);
    return this.sendSlackApi(payload);
  }

  async sendCommunityNotification(dto: SendCommunityNotificationDto) {
    const channelId = await this.getTargetChannel(dto.project, dto.type);
    const payload = this.slackBuilder.buildCommunityPayload(channelId, dto);
    return this.sendSlackApi(payload);
  }

  async sendTestNotification(dto: SendTestNotificationDto) {
    let channelId = dto.channelId;
    if (!channelId) {
      channelId = await this.getTargetChannel(dto.project, dto.eventType || 'ci');
    }
    const payload = this.slackBuilder.buildTestPayload(channelId, dto);
    return this.sendSlackApi(payload);
  }

  async sendGitNotification(dto: SendGitNotificationDto) {
    const channelId = await this.getTargetChannel(dto.project, 'git');
    const payload = this.slackBuilder.buildGitPayload(channelId, dto);
    return this.sendSlackApi(payload);
  }
}
