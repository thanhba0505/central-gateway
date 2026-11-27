import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CronFolder, CronJob, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { decryptS2SSecret, encryptS2SSecret } from '../s2s/s2s-vault.util';
import {
  CronHttpMethod,
  CronScheduleDto,
  UpdateCronJobDto,
  UpsertCronJobDto,
} from './dto/cron.dto';
import {
  CronJobOrgClient,
  CronJobOrgHistoryResponse,
  CronJobOrgJobPayload,
  CronJobOrgSchedule,
  mapHttpMethodToCronCode,
} from './cron-job-org.client';

export interface SafeCronFolder {
  id: string;
  serviceSlug: string;
  folderTitle: string;
  externalFolderId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface SafeCronJob {
  id: string;
  serviceSlug: string;
  jobKey: string;
  title: string;
  endpointPath: string;
  httpMethod: string;
  targetUrl: string;
  schedule: CronJobOrgSchedule;
  timeoutSeconds: number;
  enabled: boolean;
  saveResponses: boolean;
  headerKeys: string[];
  externalJobId: number | null;
  folderId: string | null;
  folderTitle: string | null;
  externalFolderId: number | null;
  lastSyncedAt: Date | null;
  lastTriggerAt: Date | null;
  lastTriggerStatus: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CronBrokerStatus {
  configured: boolean;
  folderPrefix: string;
  folderSuffix: string;
  environment: string;
  availableServices: string[];
}

export interface CronTriggerResult {
  ok: boolean;
  httpStatus: number;
  latencyMs: number;
  targetUrl: string;
  bodyPreview: string;
}

type CronJobWithFolder = CronJob & { folder: CronFolder | null };

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cronClient: CronJobOrgClient,
  ) {}

  getBrokerConfig(): { folderPrefix: string; folderSuffix: string; environment: string } {
    const environment = process.env.NODE_ENV || 'development';
    const rawPrefix = process.env.CRONJOB_FOLDER_PREFIX?.trim() || 'prism-hub';
    const folderPrefix = rawPrefix.replace(/-+$/, '');

    const rawSuffix = process.env.CRONJOB_FOLDER_SUFFIX;
    const folderSuffix =
      rawSuffix !== undefined ? rawSuffix.trim() : environment === 'production' ? '' : '-test';

    return { folderPrefix, folderSuffix, environment };
  }

  buildFolderTitle(serviceSlug: string): string {
    const { folderPrefix, folderSuffix } = this.getBrokerConfig();
    return `${folderPrefix}-${serviceSlug}${folderSuffix}`;
  }

  async getStatus(callerServiceSlug?: string): Promise<CronBrokerStatus> {
    const { folderPrefix, folderSuffix, environment } = this.getBrokerConfig();
    const configured = Boolean(process.env.CRONJOB_API_KEY?.trim());

    if (callerServiceSlug) {
      return {
        configured,
        folderPrefix,
        folderSuffix,
        environment,
        availableServices: [callerServiceSlug],
      };
    }

    const connections = await this.prisma.serviceConnection.findMany({
      where: { isActive: true },
      orderBy: { slug: 'asc' },
      select: { slug: true },
    });

    const availableServices = Array.from(
      new Set(['central-gateway', ...connections.map((item) => item.slug)]),
    );

    return {
      configured,
      folderPrefix,
      folderSuffix,
      environment,
      availableServices,
    };
  }

  async listFolders(callerServiceSlug?: string): Promise<SafeCronFolder[]> {
    return this.prisma.cronFolder.findMany({
      where: callerServiceSlug ? { serviceSlug: callerServiceSlug } : undefined,
      orderBy: { folderTitle: 'asc' },
    });
  }

  async syncFolders(callerServiceSlug?: string): Promise<SafeCronFolder[]> {
    const status = await this.getStatus(callerServiceSlug);
    const remoteFolders = await this.cronClient.listFolders();
    const remoteByTitle = new Map(remoteFolders.map((item) => [item.title, item.folderId]));
    const results: SafeCronFolder[] = [];
    let createdRemoteCount = 0;

    for (const serviceSlug of status.availableServices) {
      const folderTitle = this.buildFolderTitle(serviceSlug);
      let externalFolderId = remoteByTitle.get(folderTitle);

      if (externalFolderId === undefined) {
        if (createdRemoteCount > 0) {
          // Respect cron-job.org PUT /folders rate limit (max 1 req/sec)
          await new Promise((resolve) => setTimeout(resolve, 1100));
        }
        externalFolderId = await this.cronClient.createFolder(folderTitle);
        remoteByTitle.set(folderTitle, externalFolderId);
        createdRemoteCount += 1;
      }

      const saved = await this.prisma.cronFolder.upsert({
        where: { folderTitle },
        update: { serviceSlug, externalFolderId },
        create: { serviceSlug, folderTitle, externalFolderId },
      });
      results.push(saved);
    }

    return results.sort((a, b) => a.folderTitle.localeCompare(b.folderTitle));
  }

  async listJobs(callerServiceSlug?: string): Promise<SafeCronJob[]> {
    const jobs = await this.prisma.cronJob.findMany({
      where: callerServiceSlug ? { serviceSlug: callerServiceSlug } : undefined,
      include: { folder: true },
      orderBy: [{ serviceSlug: 'asc' }, { jobKey: 'asc' }],
    });

    return jobs.map((job) => this.toSafeCronJob(job));
  }

  async ensureServiceFolder(serviceSlug: string): Promise<CronFolder> {
    const folderTitle = this.buildFolderTitle(serviceSlug);
    const cached = await this.prisma.cronFolder.findUnique({
      where: { folderTitle },
    });

    if (cached) {
      return cached;
    }

    const existingFolders = await this.cronClient.listFolders();
    const matched = existingFolders.find((item) => item.title === folderTitle);
    const externalFolderId = matched
      ? matched.folderId
      : await this.cronClient.createFolder(folderTitle);

    return this.prisma.cronFolder.upsert({
      where: { folderTitle },
      update: { serviceSlug, externalFolderId },
      create: { serviceSlug, folderTitle, externalFolderId },
    });
  }

  async upsertJob(dto: UpsertCronJobDto, callerServiceSlug?: string): Promise<SafeCronJob> {
    const serviceSlug = this.resolveAuthorizedServiceSlug(dto.serviceSlug, callerServiceSlug);
    const targetUrl = await this.buildTargetUrl(serviceSlug, dto.endpointPath);
    const folder = await this.ensureServiceFolder(serviceSlug);
    const schedule = this.normalizeSchedule(dto.schedule);
    const httpMethod: CronHttpMethod = dto.httpMethod ?? 'POST';
    const timeoutSeconds = dto.timeoutSeconds ?? 30;
    const saveResponses = dto.saveResponses ?? true;

    const existing = await this.prisma.cronJob.findUnique({
      where: {
        serviceSlug_jobKey: {
          serviceSlug,
          jobKey: dto.jobKey,
        },
      },
    });

    const sanitizedHeaders = this.sanitizeHeaders(dto.headers);
    const encryptedHeaders = sanitizedHeaders
      ? encryptS2SSecret(JSON.stringify(sanitizedHeaders))
      : (existing?.encryptedHeaders ?? null);
    const headerKeys = sanitizedHeaders
      ? Object.keys(sanitizedHeaders)
      : (existing?.headerKeys ?? []);

    const effectiveHeaders = sanitizedHeaders ?? this.decryptHeaders(existing?.encryptedHeaders);
    const enabled =
      dto.enabled ?? (existing ? existing.enabled : !this.isLocalTargetUrl(targetUrl));

    const remotePayload = this.buildRemotePayload({
      url: targetUrl,
      title: dto.title.trim(),
      folderId: folder.externalFolderId,
      enabled,
      saveResponses,
      timeoutSeconds,
      httpMethod,
      schedule,
      headers: effectiveHeaders,
    });

    let externalJobId = existing?.externalJobId ?? null;
    if (externalJobId) {
      await this.cronClient.updateJob(externalJobId, remotePayload);
    } else {
      externalJobId = await this.cronClient.createJob(remotePayload);
    }

    const saved = await this.prisma.cronJob.upsert({
      where: {
        serviceSlug_jobKey: {
          serviceSlug,
          jobKey: dto.jobKey,
        },
      },
      update: {
        title: dto.title.trim(),
        endpointPath: this.normalizeEndpointPath(dto.endpointPath),
        httpMethod,
        targetUrl,
        schedule: schedule as unknown as Prisma.InputJsonValue,
        timeoutSeconds,
        enabled,
        saveResponses,
        encryptedHeaders,
        headerKeys,
        externalJobId,
        folderId: folder.id,
        lastSyncedAt: new Date(),
      },
      create: {
        serviceSlug,
        jobKey: dto.jobKey,
        title: dto.title.trim(),
        endpointPath: this.normalizeEndpointPath(dto.endpointPath),
        httpMethod,
        targetUrl,
        schedule: schedule as unknown as Prisma.InputJsonValue,
        timeoutSeconds,
        enabled,
        saveResponses,
        encryptedHeaders,
        headerKeys,
        externalJobId,
        folderId: folder.id,
        lastSyncedAt: new Date(),
      },
      include: { folder: true },
    });

    return this.toSafeCronJob(saved);
  }

  async updateJob(
    id: string,
    dto: UpdateCronJobDto,
    callerServiceSlug?: string,
  ): Promise<SafeCronJob> {
    const existing = await this.findAuthorizedJob(id, callerServiceSlug);
    const folder = await this.ensureServiceFolder(existing.serviceSlug);

    const endpointPath = dto.endpointPath
      ? this.normalizeEndpointPath(dto.endpointPath)
      : existing.endpointPath;
    const targetUrl = await this.buildTargetUrl(existing.serviceSlug, endpointPath);
    const httpMethod = (dto.httpMethod ?? existing.httpMethod) as CronHttpMethod;
    const title = dto.title?.trim() || existing.title;
    const timeoutSeconds = dto.timeoutSeconds ?? existing.timeoutSeconds;
    const enabled = dto.enabled ?? existing.enabled;
    const saveResponses = dto.saveResponses ?? existing.saveResponses;
    const schedule = dto.schedule
      ? this.normalizeSchedule(dto.schedule)
      : this.parseStoredSchedule(existing.schedule);

    const sanitizedHeaders =
      dto.headers !== undefined ? this.sanitizeHeaders(dto.headers) : undefined;
    const encryptedHeaders =
      dto.headers !== undefined
        ? sanitizedHeaders
          ? encryptS2SSecret(JSON.stringify(sanitizedHeaders))
          : null
        : existing.encryptedHeaders;
    const headerKeys =
      dto.headers !== undefined
        ? sanitizedHeaders
          ? Object.keys(sanitizedHeaders)
          : []
        : existing.headerKeys;

    const effectiveHeaders =
      dto.headers !== undefined ? sanitizedHeaders : this.decryptHeaders(existing.encryptedHeaders);

    const remotePayload = this.buildRemotePayload({
      url: targetUrl,
      title,
      folderId: folder.externalFolderId,
      enabled,
      saveResponses,
      timeoutSeconds,
      httpMethod,
      schedule,
      headers: effectiveHeaders,
    });

    let externalJobId = existing.externalJobId;
    if (externalJobId) {
      await this.cronClient.updateJob(externalJobId, remotePayload);
    } else {
      externalJobId = await this.cronClient.createJob(remotePayload);
    }

    const updated = await this.prisma.cronJob.update({
      where: { id: existing.id },
      data: {
        title,
        endpointPath,
        httpMethod,
        targetUrl,
        schedule: schedule as unknown as Prisma.InputJsonValue,
        timeoutSeconds,
        enabled,
        saveResponses,
        encryptedHeaders,
        headerKeys,
        externalJobId,
        folderId: folder.id,
        lastSyncedAt: new Date(),
      },
      include: { folder: true },
    });

    return this.toSafeCronJob(updated);
  }

  async deleteJob(id: string, callerServiceSlug?: string): Promise<{ deleted: true; id: string }> {
    const existing = await this.findAuthorizedJob(id, callerServiceSlug);

    if (existing.externalJobId) {
      try {
        await this.cronClient.deleteJob(existing.externalJobId);
      } catch (error) {
        this.logger.warn(
          `Could not delete external cron-job.org job ${existing.externalJobId}: ${(error as Error).message}`,
        );
      }
    }

    await this.prisma.cronJob.delete({ where: { id: existing.id } });
    return { deleted: true, id: existing.id };
  }

  async getJobHistory(id: string, callerServiceSlug?: string): Promise<CronJobOrgHistoryResponse> {
    const existing = await this.findAuthorizedJob(id, callerServiceSlug);
    if (!existing.externalJobId) {
      return { history: [], predictions: [] };
    }
    return this.cronClient.getJobHistory(existing.externalJobId);
  }

  async triggerJobNow(id: string, callerServiceSlug?: string): Promise<CronTriggerResult> {
    const existing = await this.findAuthorizedJob(id, callerServiceSlug);
    const headers = this.decryptHeaders(existing.encryptedHeaders) ?? {};
    const startedAt = Date.now();

    try {
      const response = await fetch(existing.targetUrl, {
        method: existing.httpMethod,
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        signal: AbortSignal.timeout(existing.timeoutSeconds * 1000),
      });
      const latencyMs = Date.now() - startedAt;
      const bodyText = await response.text().catch(() => '');

      await this.prisma.cronJob.update({
        where: { id: existing.id },
        data: {
          lastTriggerAt: new Date(),
          lastTriggerStatus: response.status,
        },
      });

      return {
        ok: response.ok,
        httpStatus: response.status,
        latencyMs,
        targetUrl: existing.targetUrl,
        bodyPreview: bodyText.slice(0, 500),
      };
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      await this.prisma.cronJob.update({
        where: { id: existing.id },
        data: {
          lastTriggerAt: new Date(),
          lastTriggerStatus: 502,
        },
      });

      return {
        ok: false,
        httpStatus: 502,
        latencyMs,
        targetUrl: existing.targetUrl,
        bodyPreview: error instanceof Error ? error.message.slice(0, 300) : 'Request failed',
      };
    }
  }

  private resolveAuthorizedServiceSlug(requestedSlug?: string, callerServiceSlug?: string): string {
    const normalizedRequested = requestedSlug?.trim().toLowerCase();

    if (callerServiceSlug) {
      if (normalizedRequested && normalizedRequested !== callerServiceSlug) {
        throw new ForbiddenException(
          `S2S service '${callerServiceSlug}' cannot manage cron jobs for '${normalizedRequested}'`,
        );
      }
      return callerServiceSlug;
    }

    return normalizedRequested || 'central-gateway';
  }

  private async findAuthorizedJob(
    id: string,
    callerServiceSlug?: string,
  ): Promise<CronJobWithFolder> {
    const job = await this.prisma.cronJob.findUnique({
      where: { id },
      include: { folder: true },
    });

    if (!job) {
      throw new NotFoundException(`Cron job not found: ${id}`);
    }

    if (callerServiceSlug && job.serviceSlug !== callerServiceSlug) {
      throw new ForbiddenException(
        `S2S service '${callerServiceSlug}' cannot access cron job owned by '${job.serviceSlug}'`,
      );
    }

    return job;
  }

  private normalizeEndpointPath(rawPath: string): string {
    const trimmed = rawPath.trim();
    if (!trimmed || trimmed.includes('://') || trimmed.includes('..') || /\s/.test(trimmed)) {
      throw new BadRequestException(
        'endpointPath must be a clean relative path without scheme, spaces, or ..',
      );
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  private async buildTargetUrl(serviceSlug: string, rawEndpointPath: string): Promise<string> {
    const endpointPath = this.normalizeEndpointPath(rawEndpointPath);

    if (serviceSlug === 'central-gateway') {
      const rawDomain =
        process.env.GATEWAY_PUBLIC_URL ||
        process.env.INTERNAL_API_URL ||
        `http://127.0.0.1:${process.env.SERVER_PORT || process.env.PORT || '5101'}`;
      const cleanDomain = rawDomain.replace(/\/api\/v1\/?$/, '').replace(/\/+$/, '');
      const cleanPrefix = '/api/v1';
      const pathPart = endpointPath.startsWith(`${cleanPrefix}/`)
        ? endpointPath
        : `${cleanPrefix}${endpointPath}`;
      return `${cleanDomain}${pathPart}`;
    }

    const conn = await this.prisma.serviceConnection.findUnique({
      where: { slug: serviceSlug },
    });

    if (!conn || !conn.isActive) {
      throw new NotFoundException(`Active service connection not found for slug '${serviceSlug}'`);
    }

    const cleanDomain = conn.domain.replace(/\/+$/, '');
    const cleanPrefix = conn.apiPrefix.replace(/\/+$/, '');
    const pathPart =
      cleanPrefix && endpointPath.startsWith(`${cleanPrefix}/`)
        ? endpointPath
        : `${cleanPrefix}${endpointPath}`;

    return `${cleanDomain}${pathPart}`;
  }

  private isLocalTargetUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    } catch {
      return false;
    }
  }

  private normalizeSchedule(schedule: CronScheduleDto): CronJobOrgSchedule {
    return {
      timezone: schedule.timezone.trim(),
      expiresAt: schedule.expiresAt ?? 0,
      hours: schedule.hours.length > 0 ? schedule.hours : [-1],
      minutes: schedule.minutes.length > 0 ? schedule.minutes : [0],
      mdays: schedule.mdays.length > 0 ? schedule.mdays : [-1],
      months: schedule.months.length > 0 ? schedule.months : [-1],
      wdays: schedule.wdays.length > 0 ? schedule.wdays : [-1],
    };
  }

  private parseStoredSchedule(raw: Prisma.JsonValue): CronJobOrgSchedule {
    const fallback: CronJobOrgSchedule = {
      timezone: 'Asia/Ho_Chi_Minh',
      expiresAt: 0,
      hours: [-1],
      minutes: [0],
      mdays: [-1],
      months: [-1],
      wdays: [-1],
    };

    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      return fallback;
    }

    const obj = raw as Record<string, unknown>;
    return {
      timezone: typeof obj.timezone === 'string' ? obj.timezone : fallback.timezone,
      expiresAt: typeof obj.expiresAt === 'number' ? obj.expiresAt : 0,
      hours: Array.isArray(obj.hours) ? (obj.hours as number[]) : fallback.hours,
      minutes: Array.isArray(obj.minutes) ? (obj.minutes as number[]) : fallback.minutes,
      mdays: Array.isArray(obj.mdays) ? (obj.mdays as number[]) : fallback.mdays,
      months: Array.isArray(obj.months) ? (obj.months as number[]) : fallback.months,
      wdays: Array.isArray(obj.wdays) ? (obj.wdays as number[]) : fallback.wdays,
    };
  }

  private sanitizeHeaders(headers?: Record<string, string>): Record<string, string> | undefined {
    if (!headers) {
      return undefined;
    }

    const entries = Object.entries(headers)
      .map(([key, value]) => [key.trim(), String(value).trim()] as const)
      .filter(([key, value]) => key.length > 0 && value.length > 0);

    if (entries.length === 0) {
      return undefined;
    }

    return Object.fromEntries(entries);
  }

  private decryptHeaders(encryptedHeaders?: string | null): Record<string, string> | undefined {
    if (!encryptedHeaders) {
      return undefined;
    }

    const plaintext = decryptS2SSecret(encryptedHeaders);
    if (!plaintext) {
      return undefined;
    }

    try {
      const parsed = JSON.parse(plaintext) as Record<string, string>;
      return this.sanitizeHeaders(parsed);
    } catch {
      return undefined;
    }
  }

  private buildRemotePayload(input: {
    url: string;
    title: string;
    folderId: number;
    enabled: boolean;
    saveResponses: boolean;
    timeoutSeconds: number;
    httpMethod: CronHttpMethod;
    schedule: CronJobOrgSchedule;
    headers?: Record<string, string>;
  }): CronJobOrgJobPayload {
    const payload: CronJobOrgJobPayload = {
      url: input.url,
      title: input.title,
      folderId: input.folderId,
      enabled: input.enabled,
      saveResponses: input.saveResponses,
      requestTimeout: input.timeoutSeconds,
      requestMethod: mapHttpMethodToCronCode(input.httpMethod),
      schedule: input.schedule,
    };

    if (input.headers && Object.keys(input.headers).length > 0) {
      payload.extendedData = {
        headers: input.headers,
      };
    }

    return payload;
  }

  private toSafeCronJob(job: CronJobWithFolder): SafeCronJob {
    return {
      id: job.id,
      serviceSlug: job.serviceSlug,
      jobKey: job.jobKey,
      title: job.title,
      endpointPath: job.endpointPath,
      httpMethod: job.httpMethod,
      targetUrl: job.targetUrl,
      schedule: this.parseStoredSchedule(job.schedule),
      timeoutSeconds: job.timeoutSeconds,
      enabled: job.enabled,
      saveResponses: job.saveResponses,
      headerKeys: job.headerKeys,
      externalJobId: job.externalJobId,
      folderId: job.folderId,
      folderTitle: job.folder?.folderTitle ?? null,
      externalFolderId: job.folder?.externalFolderId ?? null,
      lastSyncedAt: job.lastSyncedAt,
      lastTriggerAt: job.lastTriggerAt,
      lastTriggerStatus: job.lastTriggerStatus,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    };
  }
}
