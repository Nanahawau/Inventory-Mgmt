'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import StoreProductCard from '@/components/stores/StockProductCard';


type SKU = {
  id: number | string;
  skuCode?: string;
  attributes?: Record<string, string>;
  quantity?: number;
  productId?: number | string;
};

type Product = {
  id: number | string;
  name: string;
  category?: string;
  price?: string | number;
  description?: string;
  skus?: SKU[];
};

type Store = {
  id: number | string;
  name: string;
  location?: string;
  createdAt?: string;
};

export default function StoreDetailPage() {
  const params = useParams();
  const id = params?.id;
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // Get store metadata (name, location)
        try {
          const s = await api.stores.getOne(id);
          if (!cancelled) setStore(s);
        } catch {
          // ignore store fetch failure (we'll still try products)
        }

        // Attempt to fetch products for this store (expect nested skus ideally)
        const pRes = await api.products.list({ storeId: id });
        const pItems = Array.isArray(pRes) ? pRes : (pRes.items ?? pRes);
        // If products exist but no skus, attempt a best-effort per-product SKU fetch (fallback)
        let enriched = pItems || [];

        const needSkus = enriched.length && enriched[0] && enriched[0].skus === undefined;
        if (needSkus) {
          // try to fetch all SKUs and filter per product (inefficient fallback)
          try {
            const allSkus = await api.sku.list();
            const skusArr: SKU[] = Array.isArray(allSkus) ? allSkus : (allSkus.items ?? allSkus ?? []);
            enriched = enriched.map((prod: any) => ({
              ...prod,
              skus: skusArr.filter((s) => String(s.productId) === String(prod.id)),
            }));
          } catch {
            // ignore sku fetch failure
          }
        }

        if (!cancelled) setProducts(enriched);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load store details');
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{store?.name ?? `Store ${id}`}</h1>
        {store?.location ? <p className="text-sm text-slate-500">{store.location}</p> : null}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-40 bg-slate-100 rounded animate-pulse" />
          <div className="h-40 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
      ) : (
        <div className="space-y-6">
          {products && products.length ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {products.map((p) => (
                <StoreProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="bg-white p-6 rounded shadow-sm">No products found for this store.</div>
          )}
        </div>
      )}
    </div>
  );
}