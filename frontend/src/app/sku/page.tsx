'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { DataTable } from '../../components/ui/data-table';
import { useAuth } from '../../hooks/useAuth';

type Sku = { id: number; skuCode: string; attributes?: Record<string, string> };

export default function SkuPage() {
  const { token } = useAuth();
  const [data, setData] = useState<Sku[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api.sku.list(token)
      .then((res: any) => setData(res))
      .catch(() => toast.error('Failed to load SKUs'))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">SKUs</h2>
      {loading ? <p>Loading...</p> : <DataTable columns={[
        { key: 'id', header: 'ID' },
        { key: 'skuCode', header: 'Code' },
        { key: 'attributes', header: 'Attributes', render: (r) => <pre className="text-xs">{JSON.stringify(r.attributes ?? {}, null, 2)}</pre> },
      ]} data={data} />}
    </section>
  );
}