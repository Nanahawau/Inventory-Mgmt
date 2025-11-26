'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';

export default function Sidebar() {
  const pathname = usePathname() || '/dashboard';

  const items = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/stores', label: 'Stores' },
    { href: '/dashboard/products', label: 'Products' },
    { href: '/dashboard/skus', label: 'SKUs' },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-white min-h-screen p-4">
      <div className="mb-6 text-lg font-semibold">InventoryMgmt</div>

      <nav className="flex flex-col space-y-1">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`block px-3 py-2 rounded-md text-sm font-medium ${
                active ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}