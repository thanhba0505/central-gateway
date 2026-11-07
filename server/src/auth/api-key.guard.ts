import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    const configuredSecret = process.env.GATEWAY_SECRET_KEY;

    // If no secret key is configured yet in environment, allow bypass with warning (for initial setup)
    if (!configuredSecret) {
      return true;
    }

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (token !== configuredSecret) {
      throw new UnauthorizedException('Invalid Gateway Secret Key');
    }

    return true;
  }
}
