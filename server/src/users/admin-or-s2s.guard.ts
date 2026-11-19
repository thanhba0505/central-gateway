import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { verifyGatewayBearerSecret } from '../auth/gateway-secret.util';

@Injectable()
export class AdminOrS2SGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly apiKeyGuard: ApiKeyGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Check S2S HMAC signature (Primary Prism standard)
    const s2sSignature = request.headers['x-s2s-signature'];
    const s2sServiceSlug = request.headers['x-s2s-service'];
    if (s2sSignature || s2sServiceSlug) {
      return this.apiKeyGuard.canActivate(context);
    }

    // 2. Check S2S Bearer Secret Key (legacy fallback if GATEWAY_SECRET_KEY is configured)
    if (verifyGatewayBearerSecret(request.headers['authorization'])) {
      return true;
    }

    // 3. Check Gateway Session Cookie (for Central Gateway Admin UI)
    const sessionToken = request.cookies?.['gateway_session'];
    if (sessionToken) {
      const user = await this.authService.validateSession(sessionToken);
      if (user) {
        if (user.role === 'ADMIN') {
          return true;
        }
        throw new ForbiddenException('Admin role required');
      }
    }

    throw new UnauthorizedException(
      'Authentication required (Admin session or S2S HMAC signature)',
    );
  }
}
