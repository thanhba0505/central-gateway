import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { AuthService } from '../auth/auth.service';
import { ApiKeyGuard } from '../auth/api-key.guard';

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
    const authHeader = request.headers['authorization'];
    const configuredSecret = process.env.GATEWAY_SECRET_KEY;

    if (authHeader && authHeader.startsWith('Bearer ') && configuredSecret) {
      const token = authHeader.split(' ')[1];
      const tokenBuffer = Buffer.from(token);
      const secretBuffer = Buffer.from(configuredSecret);
      if (
        tokenBuffer.length === secretBuffer.length &&
        crypto.timingSafeEqual(tokenBuffer, secretBuffer)
      ) {
        return true;
      }
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
