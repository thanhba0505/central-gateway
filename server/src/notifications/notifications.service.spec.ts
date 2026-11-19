import { Test, TestingModule } from '@nestjs/testing';
import { SlackBuilderService } from './slack/slack-builder.service';
import { SendDeployNotificationDto } from './dto/notification.dto';

describe('SlackBuilderService', () => {
  let service: SlackBuilderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SlackBuilderService],
    }).compile();

    service = module.get<SlackBuilderService>(SlackBuilderService);
  });

  it('should build a valid deploy payload with title outside border', () => {
    const dto: SendDeployNotificationDto = {
      project: 'wonderlab',
      status: 'SUCCESS',
      version: 'v0.15.0',
      commit: '14be73785c05a01665b7f80b821c4ec77bc2f1f3',
      target: 'Production',
      actor: 'thanhba0505',
      appUrl: 'https://wonderlab.io.vn',
      healthUrl: 'https://wonderlab.io.vn/health',
    };

    const payload = service.buildDeployPayload('C0CGL8EHU9E', dto);

    expect(payload.channel).toBe('C0CGL8EHU9E');
    expect(payload.blocks[0]?.type).toBe('header');
    expect(payload.attachments[0]?.color).toBe('#10b981');
  });

  it('should build a valid test payload for gateway sandbox', () => {
    const payload = service.buildTestPayload('C0CGL8EBFT2', {
      project: 'wonderlab',
      eventType: 'ci',
      message: 'Hello from sandbox',
    });

    expect(payload.channel).toBe('C0CGL8EBFT2');
    expect(payload.blocks[0]?.type).toBe('header');
    expect(payload.attachments[0]?.color).toBe('#06b6d4');
  });

  it('should build a valid git push payload', () => {
    const payload = service.buildGitPayload('C0CFRUJUCSE', {
      project: 'wonderlab',
      eventType: 'push',
      actor: 'thanhba0505',
      refName: 'develop',
      headCommit: '14be73785c05a01665b7f80b821c4ec77bc2f1f3',
      commitCount: '2',
      commitLines: ['• 14be737: feat: add feature', '• 28ac912: fix: bug'],
    });

    expect(payload.channel).toBe('C0CFRUJUCSE');
    expect(payload.blocks[0]?.type).toBe('header');
    expect(payload.attachments[0]?.color).toBe('#0284c7');
  });

  it('should build a valid git PR payload', () => {
    const payload = service.buildGitPayload('C0CFRUJUCSE', {
      project: 'wonderlab',
      eventType: 'pull_request',
      actor: 'thanhba0505',
      prNumber: 42,
      prTitle: 'feat: new simulation',
      prAction: 'closed',
      prMerged: true,
      prHeadRef: 'feat/new-sim',
      prBaseRef: 'develop',
    });

    expect(payload.channel).toBe('C0CFRUJUCSE');
    expect(payload.blocks[0]?.type).toBe('header');
    expect(payload.attachments[0]?.color).toBe('#8b5cf6');
  });

  it('should build valid GitHub commit links in CI payload for central-gateway and git-pulse', () => {
    const ciPayload = service.buildCiPayload('C0CGL8EBFT2', {
      project: 'git-pulse',
      status: 'SUCCESS',
      branch: 'develop',
      commit: 'fddfb1fcbde514d76a9d4c46a78ae15cf6df19e5',
      trigger: 'push by @thanhba0505',
      pipeline: { 'Quality & Types': 'SUCCESS' },
      runUrl: 'https://github.com/thanhba0505/git-pulse/actions/runs/123',
    });

    const bodyText = JSON.stringify(ciPayload);
    expect(bodyText).toContain('https://github.com/thanhba0505/git-pulse/commit/');
    expect(ciPayload.attachments[0]?.color).toBe('#10b981');
  });
});
