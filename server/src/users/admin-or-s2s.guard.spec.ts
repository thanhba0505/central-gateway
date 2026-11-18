import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AdminOrS2SGuard } from './admin-or-s2s.guard';
import { AuthService } from '../auth/auth.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

describe('AdminOrS2SGuard', () => {
  let guard: AdminOrS2SGuard;
  let authServiceMock: {
    validateSession: jest.Mock;
  };
  let apiKeyGuardMock: {
    canActivate: jest.Mock;
  };

  const configuredSecret = 'test_gateway_secret_key_32chars_len';

  beforeEach(() => {
    process.env.GATEWAY_SECRET_KEY = configuredSecret;
    authServiceMock = {
      validateSession: jest.fn(),
    };
    apiKeyGuardMock = {
      canActivate: jest.fn(),
    };
    guard = new AdminOrS2SGuard(
      authServiceMock as unknown as AuthService,
      apiKeyGuardMock as unknown as ApiKeyGuard,
    );
  });

  function createMockContext(
    headers: Record<string, string> = {},
    cookies: Record<string, string> = {},
  ) {
    const request = {
      headers,
      cookies,
      url: '/api/v1/users/test-id',
      originalUrl: '/api/v1/users/test-id',
      method: 'GET',
    };
    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as unknown as ExecutionContext;
  }

  describe('S2S HMAC Signature Delegation', () => {
    it('should delegate to ApiKeyGuard when x-s2s-signature is present', async () => {
      apiKeyGuardMock.canActivate.mockResolvedValue(true);
      const context = createMockContext({
        'x-s2s-signature': 'mock_signature',
        'x-s2s-service': 'wonderlab',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(apiKeyGuardMock.canActivate).toHaveBeenCalledWith(context);
    });

    it('should delegate to ApiKeyGuard when x-s2s-service is present', async () => {
      apiKeyGuardMock.canActivate.mockResolvedValue(true);
      const context = createMockContext({
        'x-s2s-service': 'wonderlab',
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
      expect(apiKeyGuardMock.canActivate).toHaveBeenCalledWith(context);
    });
  });

  describe('Bearer Secret Key Fallback', () => {
    it('should allow access when Bearer token matches configured GATEWAY_SECRET_KEY', async () => {
      const context = createMockContext({
        authorization: `Bearer ${configuredSecret}`,
      });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when Bearer token is invalid and no session', async () => {
      const context = createMockContext({
        authorization: 'Bearer wrong_secret',
      });

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Admin Session Cookie', () => {
    it('should allow access when user has ADMIN role in session', async () => {
      authServiceMock.validateSession.mockResolvedValue({
        id: 'admin-id',
        role: 'ADMIN',
      });
      const context = createMockContext({}, { gateway_session: 'valid_session_token' });

      const result = await guard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should throw ForbiddenException when user has USER role in session', async () => {
      authServiceMock.validateSession.mockResolvedValue({
        id: 'user-id',
        role: 'USER',
      });
      const context = createMockContext({}, { gateway_session: 'user_session_token' });

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe('No Credentials', () => {
    it('should throw UnauthorizedException when no auth headers or cookies are present', async () => {
      const context = createMockContext();
      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });
  });
});
