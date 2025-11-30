'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { DataTable } from '@/components/ui/DataTable';

type InventoryRow = {
  id: number;
  productName?: string;
  skus: { skuCode: string; attributes?: string; stock: number }[];
};

export default function BranchInventoryPage() {
  const { id } = useParams() as { id: string };
  const { push } = useToast();
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  async function loadInventory() {
    setLoading(true);
    try {
      const res = await api.stock.listInventory({ storeId: Number(id), page, pageSize });
      const list: InventoryRow[] = Array.isArray(res?.data)
        ? res.data.map((item: any) => ({
            id: item.id,
            productName: item.product?.name ?? '',
            skus: Array.isArray(item.skuStocks)
              ? item.skuStocks.map((ss: any) => ({
                  skuCode: ss.sku?.skuCode ?? '',
                  attributes: ss.sku?.attributes ? JSON.stringify(ss.sku.attributes) : '',
                  stock: ss?.stock ?? 0,
                }))
              : [],
          }))
        : [];
      setRows(list);
      setTotal(res?.meta?.total ?? list.length);
    } catch (e: any) {
      push({ tone: 'error', title: 'Inventory', message: e.message || 'Failed to load inventory' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, page, pageSize]);

  async function onDelete(row: InventoryRow) {
    try {
      await api.stock.deleteInventoryItem(row.id);
      push({ tone: 'success', title: 'Inventory', message: 'Deleted' });
      await loadInventory();
    } catch (e: any) {
      push({ tone: 'error', title: 'Delete failed', message: e.message });
    }
  }

  const columns = [
    {
      key: 'productName',
      header: 'Product',
    },
    {
      key: 'skus',
      header: 'SKUs',
      render: (row: InventoryRow) =>
        row.skus.length
          ? (
              <ul className="list-none m-0 p-0">
                {row.skus.map((sku, idx) => (
                  <li key={idx}>
                    <span className="font-mono">{sku.skuCode}</span>
                    {sku.attributes && (
                      <span className="ml-2 text-xs text-slate-600">{sku.attributes}</span>
                    )}
                    <span className="ml-4 text-xs text-green-700 font-semibold">
                      Stock: {sku.stock}
                    </span>
                  </li>
                ))}
              </ul>
            )
          : <span className="text-slate-400 text-xs">No SKUs</span>,
    },
    {
      key: 'actions',
      header: '',
      render: (row: InventoryRow) => (
        <button
          onClick={() => onDelete(row)}
          className="text-sm text-red-700 hover:underline"
        >
          Delete
        </button>
      ),
      className: 'text-right',
    },
  ];

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Branch Inventory</h1>
        <a href="/dashboard/stores/branches" className="text-sm text-blue-700 hover:underline">
          Back
        </a>
      </div>
      <DataTable
        columns={columns}
        data={rows}
        emptyText="No inventory found."
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </section>
  );
}