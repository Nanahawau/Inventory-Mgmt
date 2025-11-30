'use client';

import Link from 'next/link';

export default function CentralReserveInventoryPage() {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Reserve Inventory (Central)</h1>
        <Link href="/dashboard/stores/central" className="text-sm text-blue-700 hover:underline">Back</Link>
      </div>

      <form className="rounded border bg-white p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium">SKU</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" placeholder="Select SKU or enter code" />
        </div>
        <div>
          <label className="block text-sm font-medium">Quantity to reserve</label>
          <input type="number" min={1} className="mt-1 w-full rounded border px-3 py-2 text-sm" placeholder="e.g., 10" />
        </div>
        <div>
          <label className="block text-sm font-medium">Reason</label>
          <input className="mt-1 w-full rounded border px-3 py-2 text-sm" placeholder="Reservation purpose" />
        </div>
        <div className="flex gap-3">
          <button type="button" className="rounded bg-slate-900 text-white px-4 py-2 text-sm">Reserve</button>
          <Link href="/dashboard/stores/central" className="rounded border px-4 py-2 text-sm">Cancel</Link>
        </div>
      </form>
    </section>
  );
}