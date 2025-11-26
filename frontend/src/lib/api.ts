const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type HttpInit = Omit<RequestInit, 'body'> & { token?: string; body?: any };

async function http<T>(path: string, init?: HttpInit) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as any),
  };
  if (init?.token) headers.Authorization = `Bearer ${init.token}`;

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    cache: 'no-store',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await res.json() : await res.text();
  if (!res.ok) {
    throw new Error(typeof data === 'string' ? data : (data as any)?.message || 'Request failed');
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
    async create(body: { name: string; location?: string }, token: string) {
      return http('/api/stores', { method: 'POST', body, token });
    },
    async getOne(id: number, token: string) {
      return http(`/api/stores/${id}`, { token });
    },
  },
  products: {
    async create(body: any, token: string) {
      return http('/api/products', { method: 'POST', body, token });
    },
    async getOne(id: number, token: string) {
      return http(`/api/products/${id}`, { token });
    },
  },
  sku: {
    async list(token: string) {
      return http('/sku', { token });
    },
    async create(
      body: { skuCode: string; attributes?: Record<string, string>; productId: number },
      token: string
    ) {
      return http('/sku', { method: 'POST', body, token });
    },
    async getOne(id: number, token: string) {
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
    async createInventory(
      body: { storeId: number; productId: number; initialStocks?: any[] },
      token: string
    ) {
      return http('/stock/inventory', { method: 'POST', body, token });
    },
    async listInventory(
      query: { storeId?: number; productId?: number; page?: number; pageSize?: number },
      token: string
    ) {
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