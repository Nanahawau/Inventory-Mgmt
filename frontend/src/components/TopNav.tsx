'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function TopNav() {
  const pathname = usePathname() || '/dashboard';
  const items = [
    { href: '/dashboard', label: 'Overview' },
    { href: '/dashboard/stores', label: 'Stores', showCount: false },
    { href: '/dashboard/products', label: 'Products' },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center justify-between">
          <div
            className="text-lg font-semibold cursor-pointer"
            onClick={() => window.location.assign('/dashboard')}
          >
            Inventory Management
          </div>
          <nav className="flex items-center gap-2" aria-label="Primary">
            {items.map((it) => {
              const active = pathname === it.href || pathname?.startsWith(it.href + '/');
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  aria-current={active ? 'page' : undefined}
                >
                  <span>{it.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}