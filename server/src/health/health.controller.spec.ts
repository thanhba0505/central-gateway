import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { PrismaService } from '../prisma/prisma.service';
import { APP_VERSION } from '../common/version';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthService: HealthService;

  const mockPrisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    serviceConnection: {
      findMany: jest.fn().mockResolvedValue([]),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockPrisma.$queryRaw.mockResolvedValue([{ 1: 1 }]);
    mockPrisma.serviceConnection.findMany.mockResolvedValue([]);

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
    healthService = module.get<HealthService>(HealthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(healthController).toBeDefined();
    expect(healthService).toBeDefined();
  });

  describe('check (lightweight)', () => {
    it('should return valid liveness response without querying the database', () => {
      const response = healthController.check();

      expect(response.status).toBe('ok');
      expect(response.service).toBe('central-gateway-server');
      expect(response.version).toBe(APP_VERSION);
      expect(typeof response.timestamp).toBe('string');
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });
  });

  describe('checkFull', () => {
    it('should return HTTP 200 and connected peer services when DB and peers succeed', async () => {
      mockPrisma.serviceConnection.findMany.mockResolvedValueOnce([
        {
          slug: 'wonderlab',
          name: 'Wonderlab Platform',
          domain: 'http://localhost:4101',
          apiPrefix: '/api/v1',
          timeoutMs: 3000,
          metadata: { healthPath: '/health' },
        },
        {
          slug: 'git-pulse',
          name: 'Git Pulse Platform',
          domain: 'http://localhost:6101',
          apiPrefix: '/api/v1',
          timeoutMs: 3000,
          metadata: { healthPath: '/health' },
        },
      ]);

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' }),
        } as unknown as globalThis.Response)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' }),
        } as unknown as globalThis.Response);

      const mockRes = { status: jest.fn() } as unknown as Response;
      const response = await healthController.checkFull(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.status).toBe('ok');
      expect(response.database).toBe('connected');
      expect(response.services).toHaveLength(2);
      expect(response.services.every((s) => s.status === 'connected')).toBe(true);
    });

    it('should still return HTTP 200 when one or more peer services fail', async () => {
      mockPrisma.serviceConnection.findMany.mockResolvedValueOnce([
        {
          slug: 'wonderlab',
          name: 'Wonderlab Platform',
          domain: 'http://localhost:4101',
          apiPrefix: '/api/v1',
          timeoutMs: 3000,
          metadata: { healthPath: '/health' },
        },
        {
          slug: 'git-pulse',
          name: 'Git Pulse Platform',
          domain: 'http://localhost:6101',
          apiPrefix: '/api/v1',
          timeoutMs: 3000,
          metadata: { healthPath: '/health' },
        },
      ]);

      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ status: 'ok' }),
        } as unknown as globalThis.Response)
        .mockRejectedValueOnce(new Error('ETIMEDOUT'));

      const mockRes = { status: jest.fn() } as unknown as Response;
      const response = await healthController.checkFull(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.OK);
      expect(response.status).toBe('degraded');
      expect(response.database).toBe('connected');
      expect(response.services[0]?.status).toBe('connected');
      expect(response.services[1]?.status).toBe('unreachable');
      expect(response.services[1]?.error).toContain('ETIMEDOUT');
    });

    it('should return HTTP 503 and error status when database ping fails', async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(new Error('DB unreachable'));

      const mockRes = { status: jest.fn() } as unknown as Response;
      const response = await healthController.checkFull(mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(HttpStatus.SERVICE_UNAVAILABLE);
      expect(response.status).toBe('error');
      expect(response.database).toBe('disconnected');
      expect(response.services).toEqual([]);
    });
  });
});
