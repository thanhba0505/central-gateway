import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AdminOrS2SGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Check S2S Bearer Secret Key
    const authHeader = request.headers['authorization'];
    const configuredSecret = process.env.GATEWAY_SECRET_KEY;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      if (configuredSecret && token === configuredSecret) {
        return true;
      }
    }

    // 2. Check Gateway Session Cookie (for Central Gateway Admin UI)
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

    // If in dev and no secret is configured, allow for testing
    if (!configuredSecret && process.env.NODE_ENV !== 'production') {
      return true;
    }

    throw new UnauthorizedException('Authentication required (Admin session or S2S Secret)');
  }
}
