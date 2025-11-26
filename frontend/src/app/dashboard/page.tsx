import { api } from '@/lib/http';

function countFrom(data: any): number {
  if (Array.isArray(data)) return data.length;
  if (data && typeof data === 'object' && Array.isArray((data as any).items)) return (data as any).items.length;
  if (data && typeof data === 'object' && typeof (data as any).count === 'number') return (data as any).count;
  return 0;
}

export default async function Page() {
  // Fetch via shared http client (no relative fetch calls)
  let storesCount = 0;
  let productsCount = 0;
  let skusCount = 0;

  try {
    const [stores, products, skus] = await Promise.all([
      api.stores.list().catch(() => []),
      api.products.list().catch(() => []),
      api.sku.list().catch(() => []),
    ]);
    storesCount = countFrom(stores);
    productsCount = countFrom(products);
    skusCount = countFrom(skus);
  } catch {
    // ignore; cards will show 0
  }

  return (
    <main className="site-container site-main">
      <div className="page-hero">
        <h1 className="text-3xl font-semibold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-slate-500">Overview and aggregated inventory data</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="card-title">Stores</div>
          <div className="text-3xl font-bold">{storesCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Products</div>
          <div className="text-3xl font-bold">{productsCount}</div>
        </div>
        <div className="card">
          <div className="card-title">SKUs</div>
          <div className="text-3xl font-bold">{skusCount}</div>
        </div>
        <div className="card">
          <div className="card-title">Low stock</div>
          <div className="text-3xl font-bold">—</div>
        </div>
      </div>

      <div className="card mt-6">
        <div className="card-title">Recent activity</div>
        <p className="muted">No recent activity available — implement server events here.</p>
      </div>
    </main>
  );
}