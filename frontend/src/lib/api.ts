import { authClient } from './auth-client';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/$/, '');

type HttpInit = Omit<RequestInit, 'body'> & { token?: string; body?: any };

function normalizeErrorPayload(data: any, res: Response): Error {
  const rawMsg =
    Array.isArray(data?.message) ? data.message.join(', ')
      : data?.message
      || data?.error
      || data?.data?.message
      || res.statusText
      || `Request failed (${res.status})`;

  const err = new Error(String(rawMsg));
  (err as any).status = res.status;
  (err as any).payload = data;
  (err as any).messages = Array.isArray(data?.message) ? data.message : [String(rawMsg)];
  return err;
}

async function http<T = any>(path: string, init?: HttpInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const headers: Record<string, string> = { ...(init?.headers as Record<string, string> | undefined ?? {}) };

  let token = init?.token;
  if (!token && typeof window !== 'undefined') {
    try { token = authClient.getToken() || undefined; } catch { token = undefined; }
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
  try { data = isJson ? await res.json() : await res.text(); } catch { data = undefined; }

  if (res.status === 401) {
    try { authClient.clear(); } catch { }
    throw normalizeErrorPayload(data, res);
  }

  if (!res.ok) throw normalizeErrorPayload(data, res);

  if (isJson && data && typeof data === 'object') {
    // If the server includes meta (pagination), return the whole envelope
    if ('meta' in data) return data as T;
    // Otherwise unwrap the common { data } envelope
    if ('data' in data) return data.data as T;
  }
  return data as T;
}

// Helpers
function normalizeProduct<T extends { price?: any }>(p: T): T {
  if (p && p.price != null) {
    const n = Number(p.price);
    if (Number.isFinite(n)) (p as any).price = n;
  }
  return p;
}
function normalizeProducts(list: any[]): any[] {
  return (list || []).map(normalizeProduct);
}
function qp(params: Record<string, any>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = {
  auth: {
    async login(email: string, password: string) {
      return http<{ access_token: string }>('/auth/login', { method: 'POST', body: { email, password } });
    },
  },

  stores: {
    async getBranchStores(query?: { page?: number; pageSize?: number }, token?: string): Promise<any | null> {
      const res = await api.stores.listBranches(query, token);
      const data = Array.isArray(res?.data) ? res.data : [];
      return {data: data.filter((store: any) => !store.isCentral) ?? null, meta: res.meta};
    },
    async create(body: { name: string; location?: string }, token?: string) {
      return http('/api/stores', { method: 'POST', body, token });
    },
    async getOne(id: number | string, token?: string) {
      return http(`/api/stores/${id}`, { token });
    },
    async remove(id: number | string, token?: string) {
      return http(`/api/stores/${id}`, { method: 'DELETE', token });
    },
    async getCentral(token?: string): Promise<any | null> {
      const res = await api.stores.listBranches(undefined, token);
      const data = Array.isArray(res?.data) ? res.data : [];
      // Find the central store (isCentral: true)
      return data.find((store: any) => store.isCentral) ?? null;
    },

    async listBranches(query?: { page?: number; pageSize?: number }, token?: string) {
      const q = qp({
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
      });
      return http(`/api/stores${q}`, { token });
    },
    async update(id: number | string, body: { name?: string; location?: string }, token?: string) {
      return http(`/api/stores/${id}`, { method: 'PUT', body, token });
    },
  },

  products: {
    async list(
      query?: { page?: number; pageSize?: number; search?: string; storeId?: number | string },
      token?: string
    ): Promise<{ items: any[]; meta: { page: number; pageSize: number; total: number } }> {
      const q = qp({
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
        search: query?.search,
        storeId: query?.storeId,
      });
      const res = await http<any>(`/api/products${q}`, { token });

      // Expect { data: Product[]; meta } or a plain array
      const itemsRaw = Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
      const items = normalizeProducts(itemsRaw);
      const meta =
        res?.meta ??
        { page: query?.page ?? 1, pageSize: query?.pageSize ?? 20, total: items.length };

      return { items, meta };
    },
    async create(body: {
      name: string;
      category?: string;
      price?: number | string;
      description?: string;
      skus: { skuCode: string; attributes?: Record<string, string> }[];
    }, token?: string) {
      const priceNum = body.price === '' || body.price == null ? undefined : Number(body.price);
      const payload = { ...body, price: Number.isFinite(priceNum!) ? priceNum : undefined };
      const created = await http(`/api/products`, { method: 'POST', body: payload, token });
      return normalizeProduct(created);
    },
    async update(id: number | string, body: {
      name?: string;
      category?: string;
      price?: number | string;
      description?: string;
      skus?: { id?: number; skuCode: string; attributes?: Record<string, string> }[];
    }, token?: string) {
      const priceNum = body.price === '' || body.price == null ? undefined : Number(body.price);
      const payload = { ...body, price: Number.isFinite(priceNum!) ? priceNum : undefined };
      const updated = await http(`/api/products/${id}`, { method: 'PUT', body: payload, token });
      return normalizeProduct(updated);
    },
    async getOne(id: number, token?: string) {
      const p = await http(`/api/products/${id}`, { token });
      return normalizeProduct(p);
    },
    async remove(id: number, token?: string) {
      return http(`/api/products/${id}`, { method: 'DELETE', token });
    },
  },

  sku: {
    async list(query?: { page?: number; pageSize?: number; productId?: number; search?: string }, token?: string) {
      const q = qp({
        productId: query?.productId,
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
        search: query?.search,
      });
      return http(`/api/sku${q}`, { token });
    },
    async create(body: { skuCode: string; attributes?: Record<string, string>; productId: number }, token?: string) {
      return http('/api/sku', { method: 'POST', body, token });
    },
    async getOne(id: number, token?: string) {
      return http(`/api/sku/${id}`, { token });
    },
    async update(id: number, body: any, token?: string) {
      return http(`/api/sku/${id}`, { method: 'PATCH', body, token });
    },
    async remove(id: number, token?: string) {
      return http(`/api/sku/${id}`, { method: 'DELETE', token });
    },
  },
  stock: {
    async listInventory(
      query: { storeId?: number; productId?: number; page?: number; pageSize?: number },
      token?: string
    ) {
      const q = qp({
        storeId: query.storeId,
        productId: query.productId,
        page: query.page ?? 1,
        pageSize: query.pageSize ?? 20,
      });
      return http(`api/stock/inventory${q}`, { token });
    },
    async createInventory(body: { storeId: number | string; productId: number | string; skuStocks?: { skuId: number; stock: number }[]; isCentral?: boolean }, token?: string) {
      return http('api/stock/inventory', { method: 'POST', body, token });
    },

    async reserve(body: {
      inventoryItemId: number,
      skuId: number
      quantity: number,
      reference?: string
    }, token?: string) {
      return http(`api/stock/reservations`, { method: 'POST', body, token });
    },

    async transferReservation(
      body: {
        centralInventoryItemId: number;
        toStoreId: number;
        productId: number
        skuId: number;
        quantity: number;
        reference?: string;
      },
      token?: string
    ) {
      return http(`api/stock/transfer`, { method: 'POST', body, token });
    },
    async listReservations(
      query?: {
        page?: number;
        pageSize?: number;
        status?: string;
        inventoryItemId?: number | string;
        skuId?: number | string;
      },
      token?: string
    ) {
      const q = qp({
        page: query?.page ?? 1,
        pageSize: query?.pageSize ?? 20,
        status: query?.status,
        inventoryItemId: query?.inventoryItemId,
        skuId: query?.skuId,
      });
      return http(`api/stock/reservations${q}`, { token });
    },
    async cancelReservation(id: number, opts?: { reference?: string }, token?: string) {
      const q = qp({ reference: opts?.reference });
      return http(`api/stock/reservations/${id}${q}`, { method: 'DELETE', token });
    },

    async deleteInventoryItem(id: number, token?: string) {
      return http(`/api/stock/inventory/${id}`, { method: 'DELETE', token });
    },
  },
}

export default api;