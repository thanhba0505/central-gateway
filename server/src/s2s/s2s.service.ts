import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface S2SCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

@Injectable()
export class S2SService {
  private readonly logger = new Logger(S2SService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calls a remote service registered in service_connections table
   */
  async call<T = unknown>(
    targetSlug: string,
    endpointPath: string,
    options: S2SCallOptions = {},
  ): Promise<T> {
    const conn = await this.prisma.serviceConnection.findUnique({
      where: { slug: targetSlug, isActive: true },
    });

    if (!conn) {
      throw new NotFoundException(`Active service connection with slug '${targetSlug}' not found`);
    }

    const cleanDomain = conn.domain.replace(/\/$/, '');
    const cleanPrefix = conn.apiPrefix.replace(/\/$/, '');
    const cleanPath = endpointPath.replace(/^\//, '');
    const fullUrl = `${cleanDomain}${cleanPrefix}/${cleanPath}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (conn.apiKey) {
      headers['Authorization'] = `Bearer ${conn.apiKey}`;
    }

    const method = options.method ?? 'GET';
    const timeout = options.timeoutMs ?? conn.timeoutMs;

    this.logger.log(`[S2S] Calling ${targetSlug} via ${method} ${fullUrl}`);

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: options.data !== undefined ? JSON.stringify(options.data) : undefined,
      signal: AbortSignal.timeout(timeout),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(
        `[S2S] Call to ${targetSlug} failed with HTTP ${response.status}: ${errText}`,
      );
    }

    return (await response.json()) as T;
  }
}
