'use client';

import Link from 'next/link';

export default function StoresPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Stores</h1>
        <Link href="/dashboard/stores/new" className="rounded bg-slate-900 text-white px-4 py-2 text-sm">
          Add store
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-medium">Central Store</h2>
          <p className="text-sm text-slate-600 mt-1">Manage central inventory and transfers.</p>
          <div className="mt-3 flex gap-3">
            <Link href="/dashboard/stores/central" className="text-blue-700 text-sm hover:underline">Open</Link>
          </div>
        </div>

        <div className="rounded border bg-white p-4">
          <h2 className="text-lg font-medium">Branch Stores</h2>
          <p className="text-sm text-slate-600 mt-1">View and manage branch store inventories.</p>
          <div className="mt-3 flex gap-3">
            <Link href="/dashboard/stores/branches" className="text-blue-700 text-sm hover:underline">Browse branches</Link>
          </div>
        </div>
      </div>
    </section>
  );
}