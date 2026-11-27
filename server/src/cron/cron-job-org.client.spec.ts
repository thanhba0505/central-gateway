import { HttpException, ServiceUnavailableException } from '@nestjs/common';
import { CronJobOrgClient, mapHttpMethodToCronCode } from './cron-job-org.client';

describe('CronJobOrgClient', () => {
  let client: CronJobOrgClient;
  const originalKey = process.env.CRONJOB_API_KEY;

  beforeEach(() => {
    process.env.CRONJOB_API_KEY = 'test-cronjob-api-key';
    client = new CronJobOrgClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
    if (originalKey === undefined) {
      delete process.env.CRONJOB_API_KEY;
    } else {
      process.env.CRONJOB_API_KEY = originalKey;
    }
  });

  it('maps HTTP methods to cron-job.org numeric codes', () => {
    expect(mapHttpMethodToCronCode('GET')).toBe(0);
    expect(mapHttpMethodToCronCode('POST')).toBe(1);
    expect(mapHttpMethodToCronCode('PUT')).toBe(4);
    expect(mapHttpMethodToCronCode('DELETE')).toBe(5);
    expect(mapHttpMethodToCronCode('PATCH')).toBe(6);
  });

  it('throws ServiceUnavailableException when CRONJOB_API_KEY is missing', async () => {
    delete process.env.CRONJOB_API_KEY;
    await expect(client.listFolders()).rejects.toThrow(ServiceUnavailableException);
  });

  it('recovers from 409 Conflict during createFolder by looking up existing folderId', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 409,
        text: async () => 'Folder already exists',
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            folders: [{ folderId: 42, title: 'prism-hub-git-pulse-test' }],
          }),
      } as unknown as Response);

    const folderId = await client.createFolder('prism-hub-git-pulse-test');

    expect(folderId).toBe(42);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('propagates HttpException when cron-job.org returns an error', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal error',
    } as unknown as Response);

    await expect(client.listFolders()).rejects.toThrow(HttpException);
  });
});
