
import { authClient } from './auth-client';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

type HttpInit = Omit<RequestInit, 'body'> & { token?: string; body?: any };

async function http<T = any>(path: string, init?: HttpInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> || {}) };

  let token = init?.token;
  if (!token && typeof window !== 'undefined') {
    try {
      token = authClient.getToken() || undefined;
    } catch {
      token = undefined;
    }
  }
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (init?.body !== undefined && init?.body !== null) {
    if (typeof FormData !== 'undefined' && init.body instanceof FormData) {
      body = init.body;
    } else {
      headers['Content-Type'] = headers['Content-Type'] || 'application/json';
      body = JSON.stringify(init.body);
    }
  }

  const res = await fetch(url, {
    method: init?.method,
    ...init,
    headers,
    body,
    cache: init?.cache ?? 'no-store',
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  let data: any;
  try {
    data = isJson ? await res.json() : await res.text();
  } catch {
    data = undefined;
  }

 if (res.status === 401) {
  // Clear local auth state but DO NOT redirect here.
  // Let the caller handle navigation (LoginForm or a central error boundary).
  try {
    authClient.clear();
  } catch (e) {
    // ignore storage/clear errors
    console.warn('[api] error clearing auth state', e);
  }

  // Compose an error message and throw so the caller (LoginForm) can handle it.
  const msg = isJson && data && (data.message || data.error) ? (data.message || data.error) : 'Unauthorized';
  throw new Error(msg);
}

  if (!res.ok) {
    const msg =
      isJson && data && (data.message || data.error || (data.data && data.data.message))
        ? data.message || data.error || data.data.message
        : typeof data === 'string'
        ? data
        : res.statusText || `Request failed (${res.status})`;
    throw new Error(msg);
  }

  if (isJson && data && typeof data === 'object') {
    if ('data' in data) return data.data as T;
    if ('result' in data) return data.result as T;
  }

  return data as T;
}

export const api = {
  auth: {
    async login(email: string, password: string) {
      return http<{ access_token: string }>('/auth/login', { method: 'POST', body: { email, password } });
    },
  },

  stores: {
    async create(body: { name: string; location?: string }, token?: string) {
      return http('/api/stores', { method: 'POST', body, token });
    },
    async getOne(id: number | string, token?: string) {
      return http(`/api/stores/${id}`, { token });
    },
    async list(token?: string) {
      return http(`/api/stores`, { token });
    },
    async count(token?: string) {
      const res = await http<{ count: number }>(`/api/stores?meta=true`, { token });
      return res?.count ?? 0;
    },
  },

  products: {
    // list optionally accepts a query object like { storeId }
    async list(query?: { storeId?: number | string } | undefined, token?: string) {
      const params = new URLSearchParams();
      if (query?.storeId !== undefined) params.set('storeId', String(query.storeId));
      const q = params.toString() ? `?${params.toString()}` : '';
      return http(`/api/products${q}`, { token });
    },
    async create(body: any, token?: string) {
      return http('/api/products', { method: 'POST', body, token });
    },
    async getOne(id: number | string, token?: string) {
      return http(`/api/products/${id}`, { token });
    },
  },

  sku: {
    async list(token?: string) {
      return http('/api/sku', { token });
    },
    async create(body: { skuCode: string; attributes?: Record<string, string>; productId: number }, token?: string) {
      return http('/api/sku', { method: 'POST', body, token });
    },
    async getOne(id: number | string, token?: string) {
      return http(`/api/sku/${id}`, { token });
    },
    async update(id: number | string, body: any, token?: string) {
      return http(`/api/sku/${id}`, { method: 'PATCH', body, token });
    },
    async remove(id: number | string, token?: string) {
      return http(`/api/sku/${id}`, { method: 'DELETE', token });
    },
  },

  stock: {
    async createInventory(body: { storeId: number; productId: number; initialStocks?: any[] }, token?: string) {
      return http('/api/stock/inventory', { method: 'POST', body, token });
    },
    async listInventory(query: { storeId?: number; productId?: number; page?: number; pageSize?: number }, token?: string) {
      const params = new URLSearchParams();
      if (query.storeId !== undefined) params.set('storeId', String(query.storeId));
      if (query.productId !== undefined) params.set('productId', String(query.productId));
      params.set('page', String(query.page ?? 1));
      params.set('pageSize', String(query.pageSize ?? 20));
      return http(`/api/stock/inventory?${params.toString()}`, { token });
    },
    async adjustSkuStock(id: number | string, body: { delta: number; type: string; reference?: string }, token?: string) {
      return http(`/api/stock/sku-stock/${id}/adjust`, { method: 'POST', body, token });
    },
  },
};

export default api;