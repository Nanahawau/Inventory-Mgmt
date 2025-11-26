'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import api from '@/lib/api';

export default function Sidebar() {
  const pathname = usePathname() || '/dashboard';
  const items = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/stores', label: 'Stores', showCount: true },
    { href: '/dashboard/products', label: 'Products' },
    // { href: '/dashboard/skus', label: 'SKUs' },
    // { href: '/reports', label: 'Reports' },
    // { href: '/settings', label: 'Settings' },
  ];

  const [storesCount, setStoresCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      setLoadingCount(true);
      try {
        // Prefer api.stores.count() if available
        const count = await api.stores.count?.();
        if (!cancelled) setStoresCount(typeof count === 'number' ? count : null);
      } catch {
        if (!cancelled) setStoresCount(null);
      } finally {
        if (!cancelled) setLoadingCount(false);
      }
    }
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return (
    <aside aria-label="Primary" className="w-64 border-r border-slate-200 bg-white min-h-screen p-4">
      <div className="mb-6 text-lg font-semibold">InventoryMgmt</div>
      <nav className="flex flex-col space-y-1" role="navigation" aria-label="Dashboard">
        {items.map((it) => {
          const active = pathname === it.href || pathname?.startsWith(it.href + '/');
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`group flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium ${
                active ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
              aria-current={active ? 'page' : undefined}
            >
              <span>{it.label}</span>
              {it.showCount ? (
                <span
                  className="ml-3 inline-flex items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-800 group-hover:bg-slate-200"
                  aria-live="polite"
                >
                  {loadingCount ? '…' : storesCount != null ? storesCount : '—'}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6 text-xs text-slate-500">v1 • Lightweight sidebar</div>
    </aside>
  );
}