export interface Project {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserItem {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'USER';
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedUsersResponse {
  data: UserItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SystemHealth {
  status: string;
  timestamp: string;
  latencyMs?: number;
}

export interface CurrentUser {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'USER';
  avatarUrl: string | null;
  isEmailVerified: boolean;
  isActive: boolean;
  hasPassword?: boolean;
  isGoogleLinked?: boolean;
  createdAt: string;
}

export interface DevDbUser {
  id: string;
  username: string;
  email: string | null;
  role: 'ADMIN' | 'USER';
  avatarUrl?: string | null;
  isActive?: boolean;
}

export type CronHttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface CronSchedule {
  timezone: string;
  expiresAt?: number;
  hours: number[];
  minutes: number[];
  mdays: number[];
  months: number[];
  wdays: number[];
}

export interface CronFolderItem {
  id: string;
  serviceSlug: string;
  folderTitle: string;
  externalFolderId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CronJobItem {
  id: string;
  serviceSlug: string;
  jobKey: string;
  title: string;
  endpointPath: string;
  httpMethod: CronHttpMethod;
  targetUrl: string;
  schedule: CronSchedule;
  timeoutSeconds: number;
  enabled: boolean;
  saveResponses: boolean;
  headerKeys: string[];
  externalJobId: number | null;
  folderId: string | null;
  folderTitle: string | null;
  externalFolderId: number | null;
  lastSyncedAt: string | null;
  lastTriggerAt: string | null;
  lastTriggerStatus: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface CronBrokerStatus {
  configured: boolean;
  folderPrefix: string;
  folderSuffix: string;
  environment: string;
  availableServices: string[];
}

export interface CronHistoryEntry {
  jobLogId?: number;
  jobId: number;
  date: number;
  datePlanned: number;
  jitter: number;
  duration: number;
  status: number;
  statusText: string;
  httpStatus?: number;
}

export interface CronTriggerResult {
  ok: boolean;
  httpStatus: number;
  latencyMs: number;
  targetUrl: string;
  bodyPreview: string;
}

export type PlatformLinkCategory =
  'apps' | 'infra' | 'source' | 'auth_notify' | 'ai_standup' | 'planned';

export type PlatformLinkEnvironment = 'ALL' | 'PRODUCTION' | 'LOCAL';

export interface PlatformLinkItem {
  id: string;
  slug: string;
  title: string;
  category: PlatformLinkCategory;
  url: string;
  secondaryUrl: string | null;
  secondaryLabel: string | null;
  description: string | null;
  accountNote: string | null;
  environment: PlatformLinkEnvironment;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function getGatewaySecretKey(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('central_gateway_secret_key') || '';
}

export function setGatewaySecretKey(key: string): void {
  if (typeof window === 'undefined') return;
  if (!key) {
    localStorage.removeItem('central_gateway_secret_key');
  } else {
    localStorage.setItem('central_gateway_secret_key', key.trim());
  }
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/proxy';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'https://central-gateway-server.vercel.app/api/v1';
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(options.headers as Record<string, string>),
  };

  const secretKey = getGatewaySecretKey();
  if (secretKey && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${secretKey}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errorDetail = `HTTP ${res.status} ${res.statusText}`;
    try {
      const errJson = (await res.json()) as { message?: string | string[] };
      if (errJson && errJson.message) {
        errorDetail = Array.isArray(errJson.message) ? errJson.message.join(', ') : errJson.message;
      }
    } catch {
      // Ignore JSON parse error on non-JSON response
    }
    throw new Error(errorDetail);
  }

  return (await res.json()) as T;
}

export const api = {
  // Projects
  async getProjects(): Promise<Project[]> {
    return request<Project[]>('/projects');
  },

  async createProject(data: {
    slug: string;
    name: string;
    description?: string;
  }): Promise<Project> {
    return request<Project>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateProjectStatus(id: string, isActive: boolean): Promise<Project> {
    return request<Project>(`/projects/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  // Users Management
  async getUsers(
    params: {
      page?: number;
      limit?: number;
      search?: string;
      role?: string;
    } = {},
  ): Promise<PaginatedUsersResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', String(params.page));
    if (params.limit) query.set('limit', String(params.limit));
    if (params.search) query.set('search', params.search);
    if (params.role && params.role !== 'all') query.set('role', params.role);

    const qs = query.toString();
    return request<PaginatedUsersResponse>(`/users${qs ? `?${qs}` : ''}`);
  },

  async updateUserStatus(id: string, isActive: boolean): Promise<UserItem> {
    return request<UserItem>(`/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  async updateUserRole(id: string, role: 'ADMIN' | 'USER'): Promise<UserItem> {
    return request<UserItem>(`/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  },

  async updateUserProfile(
    id: string,
    data: { username?: string; email?: string },
  ): Promise<UserItem> {
    return request<UserItem>(`/users/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Health probe
  async checkHealth(): Promise<SystemHealth> {
    const start = Date.now();
    const data = await request<{ status: string }>('/health');
    const latencyMs = Date.now() - start;
    return {
      status: data.status || 'ok',
      timestamp: new Date().toISOString(),
      latencyMs,
    };
  },

  // Auth & Session
  async getProfile(): Promise<{ user: CurrentUser | null }> {
    return request<{ user: CurrentUser | null }>('/auth/me');
  },

  async getDevUsers(): Promise<DevDbUser[]> {
    return request<DevDbUser[]>('/auth/dev/users');
  },

  async logout(): Promise<{ success: boolean }> {
    return request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    });
  },

  async googleLogin(payload: {
    credential?: string;
    email?: string;
    name?: string;
    googleId?: string;
    avatarUrl?: string;
  }): Promise<{ user: CurrentUser }> {
    return request<{ user: CurrentUser }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Cron Broker Management
  async getCronStatus(): Promise<CronBrokerStatus> {
    return request<CronBrokerStatus>('/cron/status');
  },

  async getCronFolders(): Promise<CronFolderItem[]> {
    return request<CronFolderItem[]>('/cron/folders');
  },

  async syncCronFolders(): Promise<CronFolderItem[]> {
    return request<CronFolderItem[]>('/cron/folders/sync', {
      method: 'POST',
    });
  },

  async getCronJobs(): Promise<CronJobItem[]> {
    return request<CronJobItem[]>('/cron/jobs');
  },

  async upsertCronJob(payload: {
    serviceSlug: string;
    jobKey: string;
    title: string;
    endpointPath: string;
    httpMethod?: CronHttpMethod;
    schedule: CronSchedule;
    timeoutSeconds?: number;
    enabled?: boolean;
    saveResponses?: boolean;
    headers?: Record<string, string>;
  }): Promise<CronJobItem> {
    return request<CronJobItem>('/cron/jobs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updateCronJob(
    id: string,
    payload: {
      title?: string;
      endpointPath?: string;
      httpMethod?: CronHttpMethod;
      schedule?: CronSchedule;
      timeoutSeconds?: number;
      enabled?: boolean;
      saveResponses?: boolean;
      headers?: Record<string, string>;
    },
  ): Promise<CronJobItem> {
    return request<CronJobItem>(`/cron/jobs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deleteCronJob(id: string): Promise<{ deleted: true; id: string }> {
    return request<{ deleted: true; id: string }>(`/cron/jobs/${id}`, {
      method: 'DELETE',
    });
  },

  async getCronJobHistory(
    id: string,
  ): Promise<{ history: CronHistoryEntry[]; predictions?: number[] }> {
    return request<{ history: CronHistoryEntry[]; predictions?: number[] }>(
      `/cron/jobs/${id}/history`,
    );
  },

  async triggerCronJob(id: string): Promise<CronTriggerResult> {
    return request<CronTriggerResult>(`/cron/jobs/${id}/trigger`, {
      method: 'POST',
    });
  },

  // Platform Directory Links
  async getPlatformLinks(params?: {
    category?: string;
    search?: string;
  }): Promise<PlatformLinkItem[]> {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') {
      query.set('category', params.category);
    }
    if (params?.search?.trim()) {
      query.set('search', params.search.trim());
    }
    const qs = query.toString();
    return request<PlatformLinkItem[]>(`/platform-links${qs ? `?${qs}` : ''}`);
  },

  async createPlatformLink(payload: {
    slug?: string;
    title: string;
    category: PlatformLinkCategory;
    url: string;
    secondaryUrl?: string | null;
    secondaryLabel?: string | null;
    description?: string | null;
    accountNote?: string | null;
    environment?: PlatformLinkEnvironment;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<PlatformLinkItem> {
    return request<PlatformLinkItem>('/platform-links', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async updatePlatformLink(
    id: string,
    payload: {
      title?: string;
      category?: PlatformLinkCategory;
      url?: string;
      secondaryUrl?: string | null;
      secondaryLabel?: string | null;
      description?: string | null;
      accountNote?: string | null;
      environment?: PlatformLinkEnvironment;
      sortOrder?: number;
      isActive?: boolean;
    },
  ): Promise<PlatformLinkItem> {
    return request<PlatformLinkItem>(`/platform-links/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  async deletePlatformLink(id: string): Promise<{ deleted: true; id: string }> {
    return request<{ deleted: true; id: string }>(`/platform-links/${id}`, {
      method: 'DELETE',
    });
  },
};
