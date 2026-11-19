import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { verifyGatewayBearerSecret } from '../auth/gateway-secret.util';

/**
 * Authenticates incoming Slack notification dispatch requests via either S2S HMAC-SHA256
 * signatures (microservice callers) or constant-time Bearer token matching GATEWAY_SECRET_KEY
 * (GitHub Actions CI/CD workflows).
 */
@Injectable()
export class NotificationAuthGuard implements CanActivate {
  constructor(private readonly apiKeyGuard: ApiKeyGuard) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. S2S HMAC-SHA256 protocol takes precedence whenever any S2S header is present
    const hasS2SHeaders = Boolean(
      request.headers['x-s2s-signature'] ||
      request.headers['x-s2s-timestamp'] ||
      request.headers['x-s2s-service'],
    );
    if (hasS2SHeaders) {
      return this.apiKeyGuard.canActivate(context);
    }

    // 2. Timing-safe Bearer secret validation for automated CI/CD workflow callers
    if (verifyGatewayBearerSecret(request.headers['authorization'])) {
      return true;
    }

    throw new UnauthorizedException(
      'Missing or invalid notification credentials (S2S HMAC signature or GATEWAY_SECRET_KEY Bearer token)',
    );
  }
}
