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
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL || 'https://central-gateway-server.onrender.com/api/v1'
  );
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
};
