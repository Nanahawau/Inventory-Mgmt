'use client';

import Link from 'next/link';

export default function BranchStoreDetailPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Branch Store</h1>
        <div className="flex gap-3">
          <Link href="/dashboard/stores/branches" className="text-sm text-blue-700 hover:underline">Back</Link>
          <Link href="/dashboard/stores/branches/1/edit" className="text-sm text-blue-700 hover:underline">Edit store</Link>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <h2 className="font-medium">Inventory</h2>
        <p className="text-sm text-slate-600 mt-1">All SKUs stocked in this branch.</p>

        <div className="mt-4 space-y-3">
          {/* Placeholder inventory rows with delete action */}
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="font-medium">SKU-001</div>
              <div className="text-sm text-slate-600">Product A • On hand: 20</div>
            </div>
            <div className="flex gap-3">
              <button type="button" className="text-sm text-red-600 hover:underline">Delete</button>
            </div>
          </div>
          <div className="flex items-center justify-between rounded border p-3">
            <div>
              <div className="font-medium">SKU-003</div>
              <div className="text-sm text-slate-600">Product C • On hand: 7</div>
            </div>
            <div className="flex gap-3">
              <button type="button" className="text-sm text-red-600 hover:underline">Delete</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}