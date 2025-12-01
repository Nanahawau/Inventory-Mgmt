'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { DataTable } from '@/components/ui/DataTable';

type CentralStore = { id: number; name: string };

type InventoryRow = {
  inventoryId?: number;
  productId?: number;
  productName?: string;
  skuId?: number;
  skuCode?: string;
  available?: number;
  reserved?: number;
};

export default function CentralStorePage() {
  const { push } = useToast();
  const [store, setStore] = useState<CentralStore | null>(null);
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [invLoading, setInvLoading] = useState(false);

  // pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function init() {
      setLoading(true);
      try {
        const central = await api.stores.getCentral();
        setStore(central);
        if (central?.id) {
          await loadInventory(central.id, page, pageSize);
        }
      } catch (e: any) {
        push({ tone: 'error', title: 'Central', message: e.message });
      } finally {
        setLoading(false);
      }
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInventory(storeId: number, p: number, ps: number) {
    setInvLoading(true);
    try {
      const res: any = await api.stock.listInventory({ storeId, page: p, pageSize: ps });
      const payload = res?.data ?? res;
      const list = Array.isArray(payload) ? payload : (payload?.items ?? []);
      const totalCount = Array.isArray(payload) ? list.length : (payload?.total ?? list.length);

      const tableRows: InventoryRow[] = Array.isArray(list)
        ? list.flatMap((d: any) =>
            (d.skuStocks || []).map((s: any) => ({
              inventoryId: d.id,
              productId: d.productId,
              productName: d.product?.name || d.productName,
              skuId: s.sku?.id || s.id,
              skuCode: s.sku?.skuCode || s.skuCode,
              available: s.stock ?? 0,
              reserved: s.reserved ?? 0,
            })),
          )
        : [];
      setRows(tableRows);
      setTotal(totalCount);
    } catch (e: any) {
      push({ tone: 'error', title: 'Inventory', message: e.message || 'Failed to load inventory' });
    } finally {
      setInvLoading(false);
    }
  }

  function onPageChange(next: number) {
    if (!store?.id) return;
    setPage(next);
    loadInventory(store.id, next, pageSize);
  }

  function onPageSizeChange(ps: number) {
    if (!store?.id) return;
    setPage(1);
    setPageSize(ps);
    loadInventory(store.id, 1, ps);
  }

  const columns = [
    {
      key: 'skuCode',
      header: 'SKU',
      className: 'whitespace-nowrap font-medium',
    },
    {
      key: 'productName',
      header: 'Product',
      className: 'text-slate-700',
    },
    {
      key: 'available',
      header: 'Available',
      render: (r: InventoryRow) => (
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            (r.available ?? 0) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}
        >
          {r.available ?? 0}
        </span>
      ),
    },
    {
      key: 'reserved',
      header: 'Reserved',
      render: (r: InventoryRow) => (
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            (r.reserved ?? 0) > 0 ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-800'
          }`}
        >
          {r.reserved ?? 0}
        </span>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (r: InventoryRow) => (
        <div className="flex gap-3">
          <Link
            href={`/dashboard/stores/central/reserve?inventoryId=${r.inventoryId}&skuId=${r.skuId}`}
            className="text-blue-700 hover:underline"
          >
            Reserve
          </Link>
        </div>
      ),
      className: 'text-right',
    },
  ];

  if (loading) return <div className="text-sm text-slate-600">Loading central store...</div>;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{store?.name || 'Central'}</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/stores/central/inventory/add"
            className="inline-flex items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Add inventory
          </Link>
          <Link
            href="/dashboard/stores/central/reservations"
            className="inline-flex items-center rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            View reservations
          </Link>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="font-semibold">Central Inventory</h2>
        <p className="text-sm text-slate-600">List of central SKUs and quantities.</p>
      </div>

      {invLoading ? (
        <div className="text-sm text-slate-600">Loading inventory...</div>
      ) : (
        <DataTable
          columns={columns}
          data={rows}
          emptyText="No inventory items yet."
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}

      <div className="text-right">
        <Link href="/dashboard/stores" className="text-sm text-blue-700 hover:underline">
          Back to stores
        </Link>
      </div>
    </section>
  );
}