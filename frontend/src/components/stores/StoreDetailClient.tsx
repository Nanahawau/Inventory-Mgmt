'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

type SKU = { id: number | string; skuCode?: string; quantity?: number; attributes?: Record<string, any> };
type Product = { id: number | string; name: string; skus?: SKU[] };
type Store = { id: number | string; name: string; location?: string; products?: Product[] };

export default function StoreDetailClient() {
  const params = useParams();
  const id = params?.id;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // try backend-provided products or fallback to filtered products list
        const pRes = await api.products.list({ storeId: Number(id) });
        const items = Array.isArray(pRes) ? pRes : (pRes.items ?? pRes);
        if (!cancelled) setProducts(items);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load store');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (!id) return <div>Invalid store id</div>;

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold">{store?.name}</h1>
      {store?.location ? <p className="text-sm text-slate-500">{store.location}</p> : null}

      <section className="mt-4">
        {products.length === 0 ? (
          <div className="text-sm text-slate-500">No products found for this store.</div>
        ) : (
          <ul className="space-y-3">
            {products.map((p) => (
              <li key={p.id} className="bg-white p-4 rounded shadow-sm">
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-500">ID: {p.id}</div>
                <div className="mt-2">
                  <div className="text-sm font-semibold mb-2">SKUs</div>
                  {p.skus && p.skus.length ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.skus.map((s) => (
                        <div key={s.id} className="border rounded p-2 text-sm">
                          <div className="font-medium">{s.skuCode}</div>
                          {s.quantity !== undefined ? <div className="text-xs text-slate-500">Qty: {s.quantity}</div> : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-slate-500">No SKUs for this product.</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}