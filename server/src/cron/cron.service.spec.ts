import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CronJobOrgClient } from './cron-job-org.client';
import { CronService } from './cron.service';

describe('CronService', () => {
  let service: CronService;
  let prismaMock: {
    serviceConnection: { findMany: jest.Mock; findUnique: jest.Mock };
    cronFolder: { findMany: jest.Mock; findUnique: jest.Mock; upsert: jest.Mock };
    cronJob: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      upsert: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };
  let cronClientMock: {
    listFolders: jest.Mock;
    createFolder: jest.Mock;
    createJob: jest.Mock;
    updateJob: jest.Mock;
    deleteJob: jest.Mock;
    getJobHistory: jest.Mock;
  };

  const originalNodeEnv = process.env.NODE_ENV;
  const originalPrefix = process.env.CRONJOB_FOLDER_PREFIX;
  const originalSuffix = process.env.CRONJOB_FOLDER_SUFFIX;

  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.CRONJOB_FOLDER_PREFIX;
    delete process.env.CRONJOB_FOLDER_SUFFIX;

    prismaMock = {
      serviceConnection: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
      },
      cronFolder: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
      },
      cronJob: {
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn().mockResolvedValue(null),
        upsert: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    cronClientMock = {
      listFolders: jest.fn().mockResolvedValue([]),
      createFolder: jest.fn().mockResolvedValue(101),
      createJob: jest.fn().mockResolvedValue(555),
      updateJob: jest.fn().mockResolvedValue(undefined),
      deleteJob: jest.fn().mockResolvedValue(undefined),
      getJobHistory: jest.fn().mockResolvedValue({ history: [], predictions: [] }),
    };

    service = new CronService(
      prismaMock as unknown as PrismaService,
      cronClientMock as unknown as CronJobOrgClient,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    process.env.NODE_ENV = originalNodeEnv;
    if (originalPrefix === undefined) delete process.env.CRONJOB_FOLDER_PREFIX;
    else process.env.CRONJOB_FOLDER_PREFIX = originalPrefix;
    if (originalSuffix === undefined) delete process.env.CRONJOB_FOLDER_SUFFIX;
    else process.env.CRONJOB_FOLDER_SUFFIX = originalSuffix;
  });

  it('builds -test folder suffix in non-production and clean title in production', () => {
    expect(service.buildFolderTitle('central-gateway')).toBe('prism-hub-central-gateway-test');
    expect(service.buildFolderTitle('git-pulse')).toBe('prism-hub-git-pulse-test');

    process.env.NODE_ENV = 'production';
    expect(service.buildFolderTitle('central-gateway')).toBe('prism-hub-central-gateway');
    expect(service.buildFolderTitle('git-pulse')).toBe('prism-hub-git-pulse');
  });

  it('rejects S2S caller trying to create a cron job for another service', async () => {
    await expect(
      service.upsertJob(
        {
          serviceSlug: 'wonderlab',
          jobKey: 'standup-tick',
          title: 'Sneaky job',
          endpointPath: '/internal/cron/tick',
          schedule: {
            timezone: 'Asia/Ho_Chi_Minh',
            hours: [20],
            minutes: [0],
            mdays: [-1],
            months: [-1],
            wdays: [-1],
          },
        },
        'git-pulse',
      ),
    ).rejects.toThrow(ForbiddenException);
  });

  it('rejects full URLs in endpointPath to prevent SSRF', async () => {
    prismaMock.serviceConnection.findUnique.mockResolvedValue({
      slug: 'git-pulse',
      domain: 'https://git-pulse-server.vercel.app',
      apiPrefix: '/api/v1',
      isActive: true,
    });

    await expect(
      service.upsertJob(
        {
          serviceSlug: 'git-pulse',
          jobKey: 'bad-ssrf',
          title: 'Bad URL',
          endpointPath: 'https://evil.example.com/steal',
          schedule: {
            timezone: 'Asia/Ho_Chi_Minh',
            hours: [20],
            minutes: [0],
            mdays: [-1],
            months: [-1],
            wdays: [-1],
          },
        },
        'git-pulse',
      ),
    ).rejects.toThrow(BadRequestException);
  });

  it('creates folder + cron job on cron-job.org and encrypts custom headers without leaking them', async () => {
    prismaMock.serviceConnection.findUnique.mockResolvedValue({
      slug: 'git-pulse',
      domain: 'https://git-pulse-server.vercel.app',
      apiPrefix: '/api/v1',
      isActive: true,
    });

    const folderRecord = {
      id: 'folder-uuid-1',
      serviceSlug: 'git-pulse',
      folderTitle: 'prism-hub-git-pulse-test',
      externalFolderId: 101,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.cronFolder.upsert.mockResolvedValue(folderRecord);
    prismaMock.cronJob.upsert.mockImplementation(async ({ create }) => ({
      id: 'job-uuid-1',
      ...create,
      folder: folderRecord,
      lastTriggerAt: null,
      lastTriggerStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await service.upsertJob(
      {
        jobKey: 'daily-standup-tick',
        title: 'Git Pulse Standup Tick',
        endpointPath: '/internal/cron/tick',
        httpMethod: 'POST',
        headers: { 'X-Cron-Secret': 'super-secret-value' },
        schedule: {
          timezone: 'Asia/Ho_Chi_Minh',
          hours: [20],
          minutes: [0],
          mdays: [-1],
          months: [-1],
          wdays: [-1],
        },
      },
      'git-pulse',
    );

    expect(cronClientMock.createFolder).toHaveBeenCalledWith('prism-hub-git-pulse-test');
    expect(cronClientMock.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'https://git-pulse-server.vercel.app/api/v1/internal/cron/tick',
        folderId: 101,
        enabled: true,
        requestMethod: 1,
        extendedData: {
          headers: { 'X-Cron-Secret': 'super-secret-value' },
        },
      }),
    );
    expect(result.targetUrl).toBe('https://git-pulse-server.vercel.app/api/v1/internal/cron/tick');
    expect(result.folderTitle).toBe('prism-hub-git-pulse-test');
    expect(result.headerKeys).toEqual(['X-Cron-Secret']);
    expect(JSON.stringify(result)).not.toContain('super-secret-value');
  });

  it('syncFolders reuses existing remote folders and creates only missing ones', async () => {
    prismaMock.serviceConnection.findMany.mockResolvedValueOnce([
      { slug: 'git-pulse' },
      { slug: 'wonderlab' },
    ]);
    cronClientMock.listFolders.mockResolvedValueOnce([
      { folderId: 11, title: 'prism-hub-central-gateway-test' },
    ]);
    cronClientMock.createFolder.mockResolvedValueOnce(12).mockResolvedValueOnce(13);
    prismaMock.cronFolder.upsert.mockImplementation(async ({ create }) => ({
      id: `id-${create.serviceSlug}`,
      ...create,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const synced = await service.syncFolders();

    expect(cronClientMock.createFolder).toHaveBeenCalledTimes(2);
    expect(cronClientMock.createFolder).toHaveBeenNthCalledWith(1, 'prism-hub-git-pulse-test');
    expect(cronClientMock.createFolder).toHaveBeenNthCalledWith(2, 'prism-hub-wonderlab-test');
    expect(synced.map((item) => item.folderTitle)).toEqual([
      'prism-hub-central-gateway-test',
      'prism-hub-git-pulse-test',
      'prism-hub-wonderlab-test',
    ]);
  });

  it('defaults enabled=false for localhost targets when enabled is omitted', async () => {
    prismaMock.serviceConnection.findUnique.mockResolvedValue({
      slug: 'git-pulse',
      domain: 'http://localhost:6101',
      apiPrefix: '/api/v1',
      isActive: true,
    });

    const folderRecord = {
      id: 'folder-uuid-1',
      serviceSlug: 'git-pulse',
      folderTitle: 'prism-hub-git-pulse-test',
      externalFolderId: 101,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    prismaMock.cronFolder.upsert.mockResolvedValue(folderRecord);
    prismaMock.cronJob.upsert.mockImplementation(async ({ create }) => ({
      id: 'job-uuid-2',
      ...create,
      folder: folderRecord,
      lastTriggerAt: null,
      lastTriggerStatus: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const result = await service.upsertJob({
      serviceSlug: 'git-pulse',
      jobKey: 'local-health',
      title: 'Local Health',
      endpointPath: '/health',
      httpMethod: 'GET',
      schedule: {
        timezone: 'Asia/Ho_Chi_Minh',
        hours: [-1],
        minutes: [0, 10, 20, 30, 40, 50],
        mdays: [-1],
        months: [-1],
        wdays: [-1],
      },
    });

    expect(result.enabled).toBe(false);
    expect(cronClientMock.createJob).toHaveBeenCalledWith(
      expect.objectContaining({
        enabled: false,
        requestMethod: 0,
      }),
    );
  });

  it('throws NotFoundException when target service connection is missing or inactive', async () => {
    prismaMock.serviceConnection.findUnique.mockResolvedValue(null);

    await expect(
      service.upsertJob({
        serviceSlug: 'unknown-svc',
        jobKey: 'test',
        title: 'Test',
        endpointPath: '/health',
        schedule: {
          timezone: 'Asia/Ho_Chi_Minh',
          hours: [20],
          minutes: [0],
          mdays: [-1],
          months: [-1],
          wdays: [-1],
        },
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
