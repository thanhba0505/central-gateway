import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SlackBuilderService } from './slack/slack-builder.service';
import {
  SendDeployNotificationDto,
  SendCiNotificationDto,
  SendCommunityNotificationDto,
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
        provider: 'slack',
      },
    });

    if (mapping) {
      return mapping.channelId;
    }

    // Default Fallback mapping
    const fallback: Record<string, string> = {
      deploy: 'C0CGL8EHU9E', // #deployments
      ci: 'C0CGL8EBFT2',     // #ci-cd
      git: 'C0CFRUJUCSE',    // #git-activity
      feedback: 'C0CFAFQH739', // #wonderlab-feedback
      comment: 'C0CFAFQRU2K',  // #wonderlab-comments
    };

    const target = fallback[eventType];
    if (!target) {
      throw new NotFoundException(`No channel mapped for event type: ${eventType}`);
    }
    return target;
  }

  private async sendSlackApi(payload: Record<string, unknown>, projectId?: string, eventType?: string) {
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

      // Save to DispatchLog
      await this.prisma.dispatchLog.create({
        data: {
          projectId,
          provider: 'slack',
          eventType: eventType || 'unknown',
          status: data.ok ? 'SUCCESS' : 'FAIL',
          payload: payload as object,
          response: data as object,
          error: data.error ? String(data.error) : null,
        },
      });

      return data;
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.error('Slack dispatch error', err);
      return { success: false, error: errMsg };
    }
  }

  async sendDeployNotification(dto: SendDeployNotificationDto) {
    const channelId = await this.getTargetChannel(dto.project, 'deploy');
    const project = await this.prisma.project.findUnique({ where: { slug: dto.project } });
    const payload = this.slackBuilder.buildDeployPayload(channelId, dto);
    return this.sendSlackApi(payload, project?.id, 'deploy');
  }

  async sendCiNotification(dto: SendCiNotificationDto) {
    const channelId = await this.getTargetChannel(dto.project, 'ci');
    const project = await this.prisma.project.findUnique({ where: { slug: dto.project } });
    const payload = this.slackBuilder.buildCiPayload(channelId, dto);
    return this.sendSlackApi(payload, project?.id, 'ci');
  }

  async sendCommunityNotification(dto: SendCommunityNotificationDto) {
    const channelId = await this.getTargetChannel(dto.project, dto.type);
    const project = await this.prisma.project.findUnique({ where: { slug: dto.project } });
    const payload = this.slackBuilder.buildCommunityPayload(channelId, dto);
    return this.sendSlackApi(payload, project?.id, dto.type);
  }
}
