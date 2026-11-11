import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeyGuard } from './api-key.guard';
import { PrismaService } from '../prisma/prisma.service';
import { generateS2SSignature } from '../s2s/s2s-crypto.util';

describe('ApiKeyGuard', () => {
  let guard: ApiKeyGuard;
  let prismaMock: {
    serviceConnection: {
      findFirst: jest.Mock;
    };
  };

  const secret = 'test_s2s_incoming_secret_123';

  beforeEach(() => {
    prismaMock = {
      serviceConnection: {
        findFirst: jest.fn(),
      },
    };
    guard = new ApiKeyGuard(prismaMock as unknown as PrismaService);
  });

  function createMockContext(
    headers: Record<string, string>,
    body?: unknown,
    url = '/api/v1/auth/google',
    method = 'POST',
  ) {
    const request = {
      headers,
      body,
      url,
      originalUrl: url,
      method,
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should throw UnauthorizedException when signature headers are missing', async () => {
    const context = createMockContext({});
    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    await expect(guard.canActivate(context)).rejects.toThrow(
      'Missing required S2S signature headers',
    );
  });

  it('should throw UnauthorizedException when timestamp is expired (> 5 min)', async () => {
    const expiredTimestamp = (Date.now() - 6 * 60 * 1000).toString();
    const context = createMockContext({
      'x-s2s-service': 'wonderlab',
      'x-s2s-timestamp': expiredTimestamp,
      'x-s2s-signature': 'mock_signature',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'S2S request timestamp expired or clock skew too high',
    );
  });

  it('should throw UnauthorizedException when service is not registered or active', async () => {
    prismaMock.serviceConnection.findFirst.mockResolvedValue(null);

    const timestamp = Date.now().toString();
    const context = createMockContext({
      'x-s2s-service': 'unknown-service',
      'x-s2s-timestamp': timestamp,
      'x-s2s-signature': 'mock_signature',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      'Unauthorized S2S service: unknown-service',
    );
  });

  it('should throw UnauthorizedException when signature does not match', async () => {
    prismaMock.serviceConnection.findFirst.mockResolvedValue({
      slug: 'wonderlab',
      incomingSecret: secret,
      isActive: true,
    });

    const timestamp = Date.now().toString();
    const context = createMockContext({
      'x-s2s-service': 'wonderlab',
      'x-s2s-timestamp': timestamp,
      'x-s2s-signature': 'invalid_signature_hex_value',
    });

    await expect(guard.canActivate(context)).rejects.toThrow('Invalid S2S HMAC signature');
  });

  it('should pass and attach serviceConnection when valid signature is provided', async () => {
    const mockConnection = {
      slug: 'wonderlab',
      incomingSecret: secret,
      isActive: true,
    };
    prismaMock.serviceConnection.findFirst.mockResolvedValue(mockConnection);

    const timestamp = Date.now().toString();
    const body = { email: 'user@wonderlab.vn' };
    const path = '/api/v1/auth/google';
    const method = 'POST';

    const validSignature = generateS2SSignature(secret, timestamp, method, path, body);

    const context = createMockContext(
      {
        'x-s2s-service': 'wonderlab',
        'x-s2s-timestamp': timestamp,
        'x-s2s-signature': validSignature,
      },
      body,
      path,
      method,
    );

    const result = await guard.canActivate(context);
    expect(result).toBe(true);
    expect(
      (context.switchToHttp().getRequest() as Record<string, unknown>).serviceConnection,
    ).toEqual(mockConnection);
  });
});
