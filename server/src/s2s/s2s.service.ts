import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { Prisma } from '@prisma/client';

export interface S2SCallOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  data?: unknown;
  headers?: Record<string, string>;
  timeoutMs?: number;
}

export interface UserSyncPayload {
  id: string;
  username: string;
  email?: string | null;
  avatarUrl?: string | null;
  role: string;
  isActive: boolean;
}

export interface SyncResult {
  slug: string;
  success: boolean;
  error?: string;
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

  /**
   * Dispatches user profile sync to all active services with metadata.syncUser = true
   */
  async dispatchUserSync(user: UserSyncPayload): Promise<SyncResult[]> {
    const connections = await this.prisma.serviceConnection.findMany({
      where: { isActive: true },
    });

    const targetConnections = connections.filter((c: { metadata?: unknown }) => {
      if (!c.metadata || typeof c.metadata !== 'object') return false;
      const meta = c.metadata as Record<string, unknown>;
      return meta.syncUser === true;
    });

    const results: SyncResult[] = [];

    for (const conn of targetConnections) {
      // Find associated project by slug so the audit log displays the project name/slug properly
      const project = await this.prisma.project.findUnique({
        where: { slug: conn.slug },
      });

      try {
        await this.call(conn.slug, '/internal/users/sync', {
          method: 'POST',
          data: user,
          timeoutMs: conn.timeoutMs,
        });

        await this.prisma.dispatchLog.create({
          data: {
            projectId: project?.id ?? null,
            provider: 's2s',
            eventType: 'user_sync',
            status: 'SUCCESS',
            payload: user as unknown as Prisma.InputJsonValue,
            response: { target: conn.slug, syncedAt: new Date().toISOString() },
          },
        });

        results.push({ slug: conn.slug, success: true });
        this.logger.log(`[S2S Sync] Successfully synced user ${user.id} to ${conn.slug}`);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        const detailedError =
          errorMsg === 'fetch failed'
            ? `fetch failed (${conn.domain}${conn.apiPrefix} is unreachable/offline)`
            : errorMsg;

        this.logger.error(
          `[S2S Sync] Failed to sync user ${user.id} to ${conn.slug}: ${detailedError}`,
        );

        await this.prisma.dispatchLog.create({
          data: {
            projectId: project?.id ?? null,
            provider: 's2s',
            eventType: 'user_sync',
            status: 'FAIL',
            payload: user as unknown as Prisma.InputJsonValue,
            error: detailedError,
          },
        });

        results.push({ slug: conn.slug, success: false, error: detailedError });
      }
    }

    return results;
  }
}
