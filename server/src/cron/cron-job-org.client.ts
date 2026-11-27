import { HttpException, HttpStatus, Injectable, ServiceUnavailableException } from '@nestjs/common';
import type { CronHttpMethod } from './dto/cron.dto';

const CRONJOB_API_BASE = 'https://api.cron-job.org';
const REQUEST_TIMEOUT_MS = 10000;

const HTTP_METHOD_CODE_MAP: Record<CronHttpMethod, number> = {
  GET: 0,
  POST: 1,
  PUT: 4,
  DELETE: 5,
  PATCH: 6,
};

export interface CronJobOrgSchedule {
  timezone: string;
  expiresAt: number;
  hours: number[];
  minutes: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
}

export interface CronJobOrgFolder {
  folderId: number;
  title: string;
}

export interface CronJobOrgJobPayload {
  url: string;
  enabled: boolean;
  title: string;
  folderId: number;
  saveResponses: boolean;
  requestTimeout: number;
  requestMethod: number;
  schedule: CronJobOrgSchedule;
  extendedData?: {
    headers?: Record<string, string>;
  };
}

export interface CronJobOrgHistoryItem {
  jobLogId?: number;
  jobId: number;
  identifier?: string;
  date: number;
  datePlanned: number;
  jitter: number;
  duration: number;
  status: number;
  statusText: string;
  httpStatus?: number;
}

export interface CronJobOrgHistoryResponse {
  history: CronJobOrgHistoryItem[];
  predictions?: number[];
}

export function mapHttpMethodToCronCode(method: CronHttpMethod): number {
  return HTTP_METHOD_CODE_MAP[method] ?? 1;
}

@Injectable()
export class CronJobOrgClient {
  private getApiKey(): string {
    const apiKey = process.env.CRONJOB_API_KEY?.trim();
    if (!apiKey) {
      throw new ServiceUnavailableException('CRONJOB_API_KEY is not configured on Central Gateway');
    }
    return apiKey;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const apiKey = this.getApiKey();
    const response = await fetch(`${CRONJOB_API_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...((init.headers as Record<string, string>) || {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    const text = await response.text();
    if (!response.ok) {
      throw new HttpException(
        `cron-job.org API ${init.method || 'GET'} ${path} failed (${response.status}): ${text.slice(0, 200)}`,
        response.status === 429 ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.BAD_GATEWAY,
      );
    }

    if (!text) {
      return {} as T;
    }

    return JSON.parse(text) as T;
  }

  async listFolders(): Promise<CronJobOrgFolder[]> {
    const data = await this.request<{ folders?: CronJobOrgFolder[] }>('/folders', {
      method: 'GET',
    });
    return data.folders ?? [];
  }

  async createFolder(title: string): Promise<number> {
    const apiKey = this.getApiKey();
    const response = await fetch(`${CRONJOB_API_BASE}/folders`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ folder: { title } }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (response.status === 409) {
      const existing = await this.listFolders();
      const matched = existing.find((item) => item.title === title);
      if (matched) {
        return matched.folderId;
      }
    }

    const text = await response.text();
    if (!response.ok) {
      throw new HttpException(
        `cron-job.org API PUT /folders failed (${response.status}): ${text.slice(0, 200)}`,
        HttpStatus.BAD_GATEWAY,
      );
    }

    const parsed = JSON.parse(text) as { folderId: number };
    return parsed.folderId;
  }

  async createJob(job: CronJobOrgJobPayload): Promise<number> {
    const data = await this.request<{ jobId: number }>('/jobs', {
      method: 'PUT',
      body: JSON.stringify({ job }),
    });
    return data.jobId;
  }

  async updateJob(jobId: number, job: Partial<CronJobOrgJobPayload>): Promise<void> {
    await this.request<Record<string, unknown>>(`/jobs/${jobId}`, {
      method: 'PATCH',
      body: JSON.stringify({ job }),
    });
  }

  async deleteJob(jobId: number): Promise<void> {
    await this.request<Record<string, unknown>>(`/jobs/${jobId}`, {
      method: 'DELETE',
    });
  }

  async getJobHistory(jobId: number): Promise<CronJobOrgHistoryResponse> {
    const data = await this.request<CronJobOrgHistoryResponse>(`/jobs/${jobId}/history`, {
      method: 'GET',
    });
    return {
      history: data.history ?? [],
      predictions: data.predictions ?? [],
    };
  }
}
