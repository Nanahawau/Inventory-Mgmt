'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';

type Store = {
  id: number | string;
  name: string;
  location?: string;
  createdAt?: string;
};

export default function StoresPage() {
  const [stores, setStores] = useState<Store[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await api.stores.list();
        const items = Array.isArray(result) ? result : (result.items ?? result);
        if (!cancelled) setStores(items);
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to load stores');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Stores</h1>
        <p className="text-sm text-slate-600 mt-1">Manage your store locations</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-8 w-1/3 bg-slate-100 rounded animate-pulse" />
          <div className="h-8 w-2/3 bg-slate-100 rounded animate-pulse" />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded">{error}</div>
      ) : (
        <div className="space-y-3">
          {stores && stores.length ? (
            <ul className="space-y-2">
              {stores.map((s) => (
                <li key={s.id} className="bg-white p-4 rounded shadow-sm flex items-center justify-between">
                  <div>
                    <Link href={`/dashboard/stores/${s.id}`} className="font-medium text-slate-900 hover:underline">
                      {s.name}
                    </Link>
                    {s.location ? <div className="text-sm text-slate-500">{s.location}</div> : null}
                  </div>
                  <div className="text-xs text-slate-500">{s.createdAt ? new Date(s.createdAt).toLocaleDateString() : null}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="bg-white p-4 rounded shadow-sm">No stores found.</div>
          )}
        </div>
      )}
    </div>
  );
}