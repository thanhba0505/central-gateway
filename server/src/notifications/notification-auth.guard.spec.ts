import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { NotificationAuthGuard } from './notification-auth.guard';
import { ApiKeyGuard } from '../auth/api-key.guard';

describe('NotificationAuthGuard', () => {
  let guard: NotificationAuthGuard;
  let apiKeyGuardMock: {
    canActivate: jest.Mock;
  };

  const configuredSecret = 'test_gateway_secret_key_32chars_len';

  beforeEach(() => {
    process.env.GATEWAY_SECRET_KEY = configuredSecret;
    apiKeyGuardMock = {
      canActivate: jest.fn(),
    };
    guard = new NotificationAuthGuard(apiKeyGuardMock as unknown as ApiKeyGuard);
  });

  afterEach(() => {
    delete process.env.GATEWAY_SECRET_KEY;
  });

  function createMockContext(headers: Record<string, string> = {}) {
    const request = {
      headers,
      url: '/api/v1/notifications/slack/ci',
      originalUrl: '/api/v1/notifications/slack/ci',
      method: 'POST',
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  it('should delegate to ApiKeyGuard when x-s2s-signature is present', async () => {
    apiKeyGuardMock.canActivate.mockResolvedValue(true);
    const context = createMockContext({
      'x-s2s-signature': 'mock_signature',
      'x-s2s-timestamp': Date.now().toString(),
      'x-s2s-service': 'wonderlab',
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(apiKeyGuardMock.canActivate).toHaveBeenCalledWith(context);
  });

  it('should delegate to ApiKeyGuard even on partial S2S headers without falling back to Bearer', async () => {
    apiKeyGuardMock.canActivate.mockRejectedValue(new UnauthorizedException('Missing S2S headers'));
    const context = createMockContext({
      'x-s2s-service': 'wonderlab',
      authorization: `Bearer ${configuredSecret}`,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    expect(apiKeyGuardMock.canActivate).toHaveBeenCalledWith(context);
  });

  it('should allow valid timing-safe Bearer GATEWAY_SECRET_KEY token', async () => {
    const context = createMockContext({
      authorization: `Bearer ${configuredSecret}`,
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
    expect(apiKeyGuardMock.canActivate).not.toHaveBeenCalled();
  });

  it('should throw UnauthorizedException for invalid Bearer token', async () => {
    const context = createMockContext({
      authorization: 'Bearer wrong_secret',
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when GATEWAY_SECRET_KEY is not configured', async () => {
    delete process.env.GATEWAY_SECRET_KEY;
    const context = createMockContext({
      authorization: `Bearer ${configuredSecret}`,
    });

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when credentials are missing', async () => {
    const context = createMockContext({});

    await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
  });
});
