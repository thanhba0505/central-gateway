import { Injectable, Logger } from '@nestjs/common';
import {
  SendDeployNotificationDto,
  SendCiNotificationDto,
  SendCommunityNotificationDto,
  SendTestNotificationDto,
  SendGitNotificationDto,
} from '../dto/notification.dto';

@Injectable()
export class SlackBuilderService {
  private readonly logger = new Logger(SlackBuilderService.name);

  buildDeployPayload(channelId: string, dto: SendDeployNotificationDto) {
    const shortSha = dto.commit.slice(0, 7);
    const repoName = dto.project === 'wonderlab' ? 'thanhba0505/wonderlab' : dto.project;

    let color = '#f59e0b';
    let title = `🚀 [${dto.project.toUpperCase()}] Production Deploy Started`;
    let actions: Record<string, unknown>[] = [];

    if (dto.status === 'SUCCESS') {
      color = '#10b981';
      title = `✅ [${dto.project.toUpperCase()}] Production Deploy Completed`;
      actions = [
        {
          type: 'button',
          text: { type: 'plain_text', text: `🌐 Visit ${dto.project}` },
          url: dto.appUrl || 'https://wonderlab.io.vn',
          style: 'primary',
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: '🩺 Health Probe' },
          url: dto.healthUrl || 'https://wonderlab.io.vn/health',
        },
      ];
    } else if (dto.status === 'FAIL') {
      color = '#ef4444';
      title = `❌ [${dto.project.toUpperCase()}] Production Deploy Failed`;
      actions = [
        {
          type: 'button',
          text: { type: 'plain_text', text: '🔍 View Failure Logs' },
          url: dto.runUrl || `https://github.com/${repoName}/actions`,
          style: 'primary',
        },
      ];
    } else {
      actions = [
        {
          type: 'button',
          text: { type: 'plain_text', text: '🔍 View Deploy Logs' },
          url: dto.runUrl || `https://github.com/${repoName}/actions`,
          style: 'primary',
        },
      ];
    }

    return {
      channel: channelId,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title, emoji: true },
        },
      ],
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Service Target:*\n\`${dto.target}\`` },
                { type: 'mrkdwn', text: `*Release Version:*\n\`${dto.version}\`` },
                {
                  type: 'mrkdwn',
                  text: `*Commit SHA:*\n<https://github.com/${repoName}/commit/${dto.commit}|\`${shortSha}\`>`,
                },
                { type: 'mrkdwn', text: `*Status:*\n\`${dto.status}\`` },
                { type: 'mrkdwn', text: '*Environment:*\n`Production`' },
                { type: 'mrkdwn', text: `*Triggered By:*\n\`@${dto.actor || 'thanhba0505'}\`` },
              ],
            },
            ...(actions.length > 0 ? [{ type: 'actions', elements: actions }] : []),
          ],
        },
      ],
    };
  }

  buildCiPayload(channelId: string, dto: SendCiNotificationDto) {
    const isSuccess = dto.status === 'SUCCESS';
    const color = isSuccess ? '#10b981' : '#ef4444';
    const title = isSuccess
      ? `✅ [${dto.project.toUpperCase()}] CI Pipeline Passed`
      : `❌ [${dto.project.toUpperCase()}] CI Pipeline Failed`;
    const repoName = dto.project === 'wonderlab' ? 'thanhba0505/wonderlab' : dto.project;
    const shortSha = dto.commit.slice(0, 7);

    // Build aligned table
    const breakdown = Object.entries(dto.pipeline)
      .map(([step, st]) => `${step.padEnd(17)}: ${st}`)
      .join('\n');

    return {
      channel: channelId,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title, emoji: true },
        },
      ],
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Branch:*\n\`${dto.branch}\`` },
                { type: 'mrkdwn', text: `*Status:*\n\`${dto.status}\`` },
                {
                  type: 'mrkdwn',
                  text: `*Commit:*\n<https://github.com/${repoName}/commit/${dto.commit}|\`${shortSha}\`>`,
                },
                { type: 'mrkdwn', text: `*Trigger:*\n\`${dto.trigger || 'push'}\`` },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Pipeline Breakdown:*\n\`\`\`\n${breakdown}\n\`\`\``,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: '🔍 View CI Run Logs' },
                  url: dto.runUrl || `https://github.com/${repoName}/actions`,
                  style: 'primary',
                },
              ],
            },
          ],
        },
      ],
    };
  }

  buildCommunityPayload(channelId: string, dto: SendCommunityNotificationDto) {
    const isComment = dto.type === 'comment';
    const color = isComment ? '#8b5cf6' : '#0284c7';
    const title = isComment
      ? `💬 [${dto.project.toUpperCase()}] New Comment Submitted`
      : `💡 [${dto.project.toUpperCase()}] New Simulation Proposal`;

    return {
      channel: channelId,
      blocks: [
        {
          type: 'header',
          text: { type: 'plain_text', text: title, emoji: true },
        },
      ],
      attachments: [
        {
          color,
          blocks: [
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: `*${isComment ? 'Simulation' : 'Topic'}:*\n\`${dto.title}\``,
                },
                { type: 'mrkdwn', text: `*Author:*\n\`${dto.author}\`` },
                ...(dto.category
                  ? [{ type: 'mrkdwn', text: `*Category:*\n\`${dto.category}\`` }]
                  : []),
                { type: 'mrkdwn', text: `*Source:*\n\`${dto.project} Community\`` },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*${isComment ? 'Comment' : 'Description'}:*\n\`\`\`\n${dto.content}\n\`\`\``,
              },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: {
                    type: 'plain_text',
                    text: isComment ? '🛡️ Moderate Comments' : '📋 View All Requests',
                  },
                  url: dto.adminUrl || 'https://wonderlab.io.vn/admin',
                  style: 'primary',
                },
                ...(dto.actionUrl
                  ? [
                      {
                        type: 'button',
                        text: {
                          type: 'plain_text',
                          text: isComment ? '🔬 Open Simulation' : '🚀 Open Feature',
                        },
                        url: dto.actionUrl,
                      },
                    ]
                  : []),
              ],
            },
          ],
        },
      ],
    };
  }

  buildTestPayload(channelId: string, dto: SendTestNotificationDto) {
    const timestamp = new Date().toISOString();
    return {
      channel: channelId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `🧪 [${dto.project.toUpperCase()}] Central Gateway Test Dispatch`,
            emoji: true,
          },
        },
      ],
      attachments: [
        {
          color: '#06b6d4',
          blocks: [
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Project:*\n\`${dto.project}\`` },
                { type: 'mrkdwn', text: `*Event Scope:*\n\`${dto.eventType || 'test'}\`` },
                { type: 'mrkdwn', text: `*Target Channel:*\n\`${channelId}\`` },
                { type: 'mrkdwn', text: '*Source:*\n`Gateway Control Plane`' },
              ],
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Message Content:*\n\`\`\`\n${dto.message}\n\`\`\``,
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: `⏱ Dispatched at: \`${timestamp}\` | Gateway System Sandbox`,
                },
              ],
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: '⚡ Open Control Plane' },
                  url: 'https://central-gateway-client.onrender.com',
                  style: 'primary',
                },
              ],
            },
          ],
        },
      ],
    };
  }

  buildGitPayload(channelId: string, dto: SendGitNotificationDto) {
    const repoName = dto.project === 'wonderlab' ? 'thanhba0505/wonderlab' : dto.project;
    const actor = dto.actor || 'developer';

    if (dto.eventType === 'branch_created') {
      const baseBranch = dto.baseBranch || 'develop';
      const refName = dto.refName || 'feature';
      const compareUrl =
        dto.compareUrl || `https://github.com/${repoName}/compare/${baseBranch}...${refName}`;

      return {
        channel: channelId,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🌿 [${dto.project.toUpperCase()}] New Branch Created`,
              emoji: true,
            },
          },
        ],
        attachments: [
          {
            color: '#059669',
            blocks: [
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*Branch:*\n\`${refName}\`` },
                  { type: 'mrkdwn', text: `*Created By:*\n\`@${actor}\`` },
                  { type: 'mrkdwn', text: `*Base Ref:*\n\`${baseBranch}\`` },
                  { type: 'mrkdwn', text: '*Event:*\n`BRANCH_CREATED`' },
                ],
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: '🌿 Compare Branch' },
                    url: compareUrl,
                    style: 'primary',
                  },
                ],
              },
            ],
          },
        ],
      };
    }

    if (dto.eventType === 'pull_request') {
      const isMerged = dto.prMerged === true;
      const action = dto.prAction || 'opened';
      let statusText = 'OPEN';
      let title = `🔀 [${dto.project.toUpperCase()}] Pull Request Opened`;
      let color = '#0284c7';

      if (action === 'closed' && isMerged) {
        statusText = 'MERGED';
        title = `🟣 [${dto.project.toUpperCase()}] Pull Request Merged`;
        color = '#8b5cf6';
      } else if (action === 'closed') {
        statusText = 'CLOSED';
        title = `❌ [${dto.project.toUpperCase()}] Pull Request Closed`;
        color = '#64748b';
      } else if (action === 'reopened') {
        statusText = 'REOPENED';
        title = `🔄 [${dto.project.toUpperCase()}] Pull Request Reopened`;
        color = '#0284c7';
      }

      return {
        channel: channelId,
        blocks: [
          {
            type: 'header',
            text: { type: 'plain_text', text: title, emoji: true },
          },
        ],
        attachments: [
          {
            color,
            blocks: [
              {
                type: 'section',
                fields: [
                  { type: 'mrkdwn', text: `*PR:*\n\`#${dto.prNumber || ''}\`` },
                  { type: 'mrkdwn', text: `*Status:*\n\`${statusText}\`` },
                  {
                    type: 'mrkdwn',
                    text: `*Flow:*\n\`${dto.prHeadRef || ''}\` ➔ \`${dto.prBaseRef || ''}\``,
                  },
                  { type: 'mrkdwn', text: `*Author:*\n\`@${actor}\`` },
                ],
              },
              {
                type: 'section',
                text: { type: 'mrkdwn', text: `*Title:*\n\`\`\`${dto.prTitle || ''}\`\`\`` },
              },
              {
                type: 'actions',
                elements: [
                  {
                    type: 'button',
                    text: { type: 'plain_text', text: '🔀 View Pull Request' },
                    url: dto.prUrl || `https://github.com/${repoName}/pulls`,
                    style: 'primary',
                  },
                ],
              },
            ],
          },
        ],
      };
    }

    // Default to 'push'
    const shortSha = dto.headCommit ? dto.headCommit.slice(0, 7) : '';
    const commitLink = shortSha
      ? `<https://github.com/${repoName}/commit/${dto.headCommit}|\`${shortSha}\`>`
      : '`--`';
    const commitLines =
      dto.commitLines && dto.commitLines.length > 0
        ? dto.commitLines.join('\n')
        : `• ${shortSha || 'latest'}: Update ${dto.refName || 'branch'}`;

    return {
      channel: channelId,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `📌 [${dto.project.toUpperCase()}] New Commits Pushed`,
            emoji: true,
          },
        },
      ],
      attachments: [
        {
          color: '#0284c7',
          blocks: [
            {
              type: 'section',
              fields: [
                { type: 'mrkdwn', text: `*Branch:*\n\`${dto.refName || 'develop'}\`` },
                { type: 'mrkdwn', text: `*Author:*\n\`@${actor}\`` },
                { type: 'mrkdwn', text: `*Commits:*\n\`${dto.commitCount || '1'} commit(s)\`` },
                { type: 'mrkdwn', text: `*Latest SHA:*\n${commitLink}` },
              ],
            },
            {
              type: 'section',
              text: { type: 'mrkdwn', text: `*Commit Log:*\n\`\`\`\n${commitLines}\n\`\`\`` },
            },
            {
              type: 'actions',
              elements: [
                {
                  type: 'button',
                  text: { type: 'plain_text', text: '🔍 View Changes' },
                  url:
                    dto.compareUrl ||
                    `https://github.com/${repoName}/commits/${dto.refName || 'develop'}`,
                  style: 'primary',
                },
              ],
            },
          ],
        },
      ],
    };
  }
}
