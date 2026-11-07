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
});
