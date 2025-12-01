'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/toast-context';

type InventoryItem = {
  id: number;
  productId: number;
  product?: { name?: string };
  productName?: string;
  skuStocks?: {
    id?: number;
    skuId?: number;
    sku: { skuCode?: string, id?: number };
    skuCode?: string;
    stock?: number;     // actual available field
    reserved?: number;
  }[];
};

export default function CentralReservePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const { push } = useToast();

  const [centralStore, setCentralStore] = useState<any | null>(null);

  // IDs from URL
  const [inventoryId, setInventoryId] = useState<number | ''>(() => {
    const raw = sp.get('inventoryId');
    return raw && raw !== 'undefined' ? Number(raw) : '';
  });
  const [skuId, setSkuId] = useState<number | ''>(() => {
    const raw = sp.get('skuId');
    return raw && raw !== 'undefined' ? Number(raw) : '';
  });

  // Display info
  const [productName, setProductName] = useState<string>('');
  const [skuCode, setSkuCode] = useState<string>('');

  // Availability (from s.stock)
  const [available, setAvailable] = useState<number>(0);

  // Form fields
  const [quantity, setQuantity] = useState<number | ''>('');
  const [reference, setReference] = useState('');

  const [loading, setLoading] = useState(true);

  // Load central store
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const central = await api.stores.getCentral();
        setCentralStore(central);
      } catch (e: any) {
        push({ tone: 'error', title: 'Load failed', message: e.message });
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch the specific inventory item and derive names + available (using stock)
  useEffect(() => {
    async function fetchInventoryDetails() {
      if (!centralStore?.id || !inventoryId) return;

      try {
        const res: any = await api.stock.listInventory({
          storeId: centralStore.id,
          page: 1,
          pageSize: 500,
        });
        const payload = res?.data ?? res;
        const items: InventoryItem[] = Array.isArray(payload) ? payload : (payload?.items ?? []);
        const inv = items.find((i) => Number(i.id) === Number(inventoryId));
        if (!inv) return;

        setProductName(inv.product?.name || inv.productName || '');

        if (skuId) {
          const found = (inv.skuStocks ?? []).find((s) => Number(s.sku.id) === Number(skuId));
          setSkuCode(found?.sku?.skuCode || found?.skuCode || '');
          setAvailable(Number(found?.stock ?? 0));
        } else {
          // Sum available stock across SKUs
          const sum = (inv.skuStocks ?? []).reduce((acc, s) => acc + Number(s.stock ?? 0), 0);
          setAvailable(sum);
        }
      } catch {
        setAvailable(0);
      }
    }
    fetchInventoryDetails();
  }, [centralStore?.id, inventoryId, skuId]);

  async function onSubmit() {
    if (!centralStore?.id || !inventoryId || !quantity) {
      push({ tone: 'error', title: 'Validation', message: 'Inventory and quantity are required' });
      return;
    }
    const qtyNum = Number(quantity);
    if (Number.isNaN(qtyNum) || qtyNum <= 0) {
      push({ tone: 'error', title: 'Validation', message: 'Enter a valid quantity (> 0)' });
      return;
    }
    if (qtyNum > available) {
      push({ tone: 'error', title: 'Validation', message: `Quantity (${qtyNum}) exceeds available (${available})` });
      return;
    }

    try {
      await api.stock.reserve({
        storeId: centralStore.id,
        inventoryItemId : Number(inventoryId),
        skuId: skuId ? Number(skuId) : undefined,
        quantity: qtyNum,
        reference: reference || undefined,
        isCentral: true,
      } as any);
      push({ tone: 'success', title: 'Reservation', message: 'Reserved inventory' });
      router.push('/dashboard/stores/central/reservations');
    } catch (e: any) {
      push({ tone: 'error', title: 'Reserve failed', message: e.message });
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reserve Inventory (Central)</h1>
        <button onClick={() => router.back()} className="text-sm text-blue-700 hover:underline">Back</button>
      </div>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-sm font-medium">Inventory ID</label>
          <input
            className="mt-1 w-full rounded border p-2"
            type="number"
            placeholder="Inventory ID"
            value={inventoryId as any}
            onChange={(e) => setInventoryId(e.target.value ? Number(e.target.value) : '')}
          />
          <p className="mt-1 text-xs text-slate-600">
            {productName ? `Selected product: ${productName}` : 'Enter inventory ID to fetch details'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium">SKU (optional)</label>
          <input
            className="mt-1 w-full rounded border p-2"
            type="number"
            placeholder="SKU ID"
            value={skuId as any}
            onChange={(e) => setSkuId(e.target.value ? Number(e.target.value) : '')}
          />
          <p className="mt-1 text-xs text-slate-600">
            {skuCode ? `Selected: ${skuCode}` : 'Enter SKU ID to fetch code'}
          </p>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-sm font-medium">Quantity</label>
            <input
              className="mt-1 w-full rounded border p-2"
              type="number"
              min={1}
              value={quantity as any}
              onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Available</label>
            <span className={`mt-2 inline-block rounded px-2 py-1 text-xs font-medium ${
              available > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {available}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Reference (optional)</label>
          <input
            className="mt-1 w-full rounded border p-2"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>

        <button
          onClick={onSubmit}
          className="inline-flex items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Reserve
        </button>
      </div>
    </section>
  );
}