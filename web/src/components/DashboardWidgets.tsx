'use client';

import React from 'react';

type Stats = {
  storesCount?: number;
  productsCount?: number;
  skusCount?: number;
  lowStockCount?: number;
};

function StatCard({ title, value }: { title: string; value: string | number | undefined }) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value ?? '—'}</div>
    </div>
  );
}

export default function DashboardWidgets({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard title="Stores" value={stats.storesCount} />
      <StatCard title="Products" value={stats.productsCount} />
      <StatCard title="SKUs" value={stats.skusCount} />
      <StatCard title="Low stock" value={stats.lowStockCount} />
    </div>
  );
}