import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { verifyS2SSignature } from '../s2s/s2s-crypto.util';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly logger = new Logger(ApiKeyGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers['authorization'];
    const s2sSignature = request.headers['x-s2s-signature'] as string | undefined;
    const s2sTimestamp = request.headers['x-s2s-timestamp'] as string | undefined;
    const s2sServiceSlug = request.headers['x-s2s-service'] as string | undefined;

    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
    const configuredEnvSecret = process.env.GATEWAY_SECRET_KEY;

    // 1. If HMAC-SHA256 headers are present, enforce cryptographic signature check with replay prevention
    if (s2sSignature && s2sTimestamp) {
      const now = Date.now();
      const ts = Number(s2sTimestamp);

      // Replay attack prevention: max 5-minute skew tolerance
      if (isNaN(ts) || Math.abs(now - ts) > 5 * 60 * 1000) {
        throw new UnauthorizedException('S2S request timestamp expired or clock skew too high');
      }

      // Look up candidate connections
      const activeConnections = await this.prisma.serviceConnection.findMany({
        where: {
          isActive: true,
          incomingSecret: { not: null },
          ...(s2sServiceSlug ? { slug: s2sServiceSlug } : {}),
        },
      });

      const targetPath = request.originalUrl || request.url;

      const matchedConnection = activeConnections.find((conn) => {
        if (!conn.incomingSecret) return false;
        return verifyS2SSignature(
          conn.incomingSecret,
          s2sTimestamp,
          request.method,
          targetPath,
          s2sSignature,
          request.body,
        );
      });

      if (matchedConnection) {
        (request as Request & { serviceConnection?: unknown }).serviceConnection =
          matchedConnection;
        return true;
      }

      this.logger.warn(`S2S HMAC signature verification failed for path: ${targetPath}`);
      throw new UnauthorizedException('Invalid S2S HMAC signature');
    }

    // 2. Legacy Bearer token check against dynamic service_connections
    if (token) {
      const tokenBuffer = Buffer.from(token);

      const activeConnections = await this.prisma.serviceConnection.findMany({
        where: {
          isActive: true,
          incomingSecret: { not: null },
        },
      });

      const matched = activeConnections.find((conn) => {
        if (!conn.incomingSecret) return false;
        const secretBuffer = Buffer.from(conn.incomingSecret);
        if (secretBuffer.length !== tokenBuffer.length) return false;
        return crypto.timingSafeEqual(secretBuffer, tokenBuffer);
      });

      if (matched) {
        (request as Request & { serviceConnection?: unknown }).serviceConnection = matched;
        return true;
      }

      // Check against GATEWAY_SECRET_KEY env if configured
      if (configuredEnvSecret) {
        const envSecretBuffer = Buffer.from(configuredEnvSecret);
        if (
          tokenBuffer.length === envSecretBuffer.length &&
          crypto.timingSafeEqual(tokenBuffer, envSecretBuffer)
        ) {
          return true;
        }
      }

      throw new UnauthorizedException('Invalid service token');
    }

    // 3. Fallback: If no secret is configured yet in local dev environment and no auth header, allow bypass
    if (!configuredEnvSecret && process.env.NODE_ENV !== 'production') {
      this.logger.warn('No GATEWAY_SECRET_KEY configured in dev; bypassing ApiKeyGuard.');
      return true;
    }

    throw new UnauthorizedException('Missing Authorization or S2S signature headers');
  }
}
