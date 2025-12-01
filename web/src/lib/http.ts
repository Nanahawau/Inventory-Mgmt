const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type HttpInit = Omit<RequestInit, 'body'> & { token?: string; body?: any };

function safeJsonStringify(value: any) {
  try { return JSON.stringify(value); } catch { return '[unserializable]'; }
}

function extractErrorMessage(payload: any): string {
  if (payload == null) return 'Request failed';
  if (typeof payload === 'string') return payload;
  const msg = (payload as any)?.message;
  const errs = (payload as any)?.errors;
  if (Array.isArray(msg) && msg.length) return msg.join(', ');
  if (typeof msg === 'string' && msg) return msg;
  if (Array.isArray(errs) && errs.length) return errs.join(', ');
  if (typeof (payload as any)?.error === 'string' && (payload as any)?.error) return (payload as any).error;
  return 'Request failed';
}

async function http<T>(path: string, init?: HttpInit): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init?.headers as any) };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;

  const url = `${API_URL}${path}`;
  const res = await fetch(url, { ...init, headers, body: init?.body ? JSON.stringify(init.body) : undefined, cache: 'no-store' });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = extractErrorMessage(payload);
    console.error('[http] error:', message);
    throw new Error(message);
  }

  const result =
    payload && typeof payload === 'object' && payload !== null && 'data' in (payload as any)
      ? ((payload as any).data as T)
      : (payload as T);

  return result;
}

export const api = {
  auth: {
    async login(email: string, password: string) {
      return http<{ access_token: string; user: any }>('/auth/login', { method: 'POST', body: { email, password } });
    },
  },
  stores: {
    async create(body: { name: string; location?: string }, token: string) {
      return http('/stores', { method: 'POST', body, token });
    },
    async getOne(id: number, token?: string) {
      return http(`/stores/${id}`, { token });
    },
    async list(token?: string) {
      return http('/stores', { token });
    },
  },
  products: {
    async create(body: any, token: string) {
      return http('/products', { method: 'POST', body, token });
    },
    async getOne(id: number, token?: string) {
      return http(`/products/${id}`, { token });
    },
    async list(token?: string) {
      return http('/products', { token });
    },
  },
  sku: {
    async list(token?: string) {
      return http('/sku', { token });
    },
    async create(body: { skuCode: string; attributes?: Record<string, string>; productId: number }, token: string) {
      return http('/sku', { method: 'POST', body, token });
    },
    async getOne(id: number, token?: string) {
      return http(`/sku/${id}`, { token });
    },
    async update(id: number, body: any, token: string) {
      return http(`/sku/${id}`, { method: 'PATCH', body, token });
    },
    async remove(id: number, token: string) {
      return http(`/sku/${id}`, { method: 'DELETE', token });
    },
  },
  stock: {
    async createInventory(body: { storeId: number; productId: number; initialStocks?: any[] }, token: string) {
      return http('/stock/inventory', { method: 'POST', body, token });
    },
    async listInventory(query: { storeId?: number; productId?: number; page?: number; pageSize?: number }, token?: string) {
      const params = new URLSearchParams();
      if (query.storeId) params.set('storeId', String(query.storeId));
      if (query.productId) params.set('productId', String(query.productId));
      params.set('page', String(query.page ?? 1));
      params.set('pageSize', String(query.pageSize ?? 20));
      return http(`/stock/inventory?${params.toString()}`, { token });
    },
    async adjustSkuStock(id: number, body: { delta: number; type: string; reference?: string }, token: string) {
      return http(`/stock/sku-stock/${id}/adjust`, { method: 'POST', body, token });
    },
  },
};