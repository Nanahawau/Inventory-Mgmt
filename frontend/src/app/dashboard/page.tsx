'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';

interface SkuStock {
  stock: number;
}

interface InventoryItem {
  skuStocks: SkuStock[];
}

interface Branch {
  id: number;
}

export default function DashboardPage() {
  const [storeCount, setStoreCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [skuCount, setSkuCount] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [reservedCount, setReservedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAggregates() {
      setLoading(true);
      try {
        // 1. Stores (branches + central)
        const allBranches = await api.stores.listBranches();
        setStoreCount(allBranches?.meta?.total ?? 0);

        // 2. Products
        const productsRes = await api.products.list({ page: 1, pageSize: 1 });
        setProductCount(productsRes?.meta?.total ?? 0);

        // 3. SKUs
        const skuRes = await api.sku.list({ page: 1, pageSize: 1 });
        setSkuCount(skuRes?.meta?.total ?? 0);

        // 4. Low stock SKUs (stock < 5)
        let lowStock = 0;
        // Central
        const centralInvRes = await api.stock.listInventory({ page: 1, pageSize: 100, storeId: centralRes?.id });
        if (Array.isArray(centralInvRes?.data)) {
          centralInvRes.data.forEach((item: InventoryItem) => {
            if (Array.isArray(item.skuStocks)) {
              lowStock += item.skuStocks.filter((ss: SkuStock) => Number(ss.stock) < 5).length;
            }
          });
        }
        // Branches
        if (branchTotal > 0) {
          const branchesListRes = await api.stores.listBranches({ page: 1, pageSize: branchTotal });
          const branchList: Branch[] = Array.isArray(branchesListRes?.data) ? branchesListRes.data : [];
          for (const branch of branchList) {
            const branchInvRes = await api.stock.listInventory({ page: 1, pageSize: 100, storeId: branch.id });
            if (Array.isArray(branchInvRes?.data)) {
              branchInvRes.data.forEach((item: InventoryItem) => {
                if (Array.isArray(item.skuStocks)) {
                  lowStock += item.skuStocks.filter((ss: SkuStock) => Number(ss.stock) < 5).length;
                }
              });
            }
          }
        }
        setLowStockCount(lowStock);

        // 5. Reserved inventory (sum of active reservations)
        const resvRes = await api.stock.listReservations({ page: 1, pageSize: 100, status: 'active' });
        const reserved = Array.isArray(resvRes?.data)
          ? resvRes.data.reduce((acc: number, r: { quantity?: number }) => acc + (Number(r.quantity) || 0), 0)
          : 0;
        setReservedCount(reserved);

      } catch (e) {
        // Optionally handle error
      } finally {
        setLoading(false);
      }
    }
    fetchAggregates();
  }, []);

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="text-slate-600">Overview and aggregated inventory data</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <div className="rounded bg-white border p-6 flex flex-col">
          <span className="text-lg font-semibold">Stores</span>
          <span className="mt-2 text-4xl font-bold">{loading ? '...' : storeCount}</span>
        </div>
        <div className="rounded bg-white border p-6 flex flex-col">
          <span className="text-lg font-semibold">Products</span>
          <span className="mt-2 text-4xl font-bold">{loading ? '...' : productCount}</span>
        </div>
        <div className="rounded bg-white border p-6 flex flex-col">
          <span className="text-lg font-semibold">SKUs</span>
          <span className="mt-2 text-4xl font-bold">{loading ? '...' : skuCount}</span>
        </div>
        <div className="rounded bg-white border p-6 flex flex-col">
          <span className="text-lg font-semibold">Low stock SKUs</span>
          <span className="mt-2 text-4xl font-bold">{loading ? '...' : lowStockCount}</span>
        </div>
        <div className="rounded bg-white border p-6 flex flex-col">
          <span className="text-lg font-semibold">Reserved Inventory</span>
          <span className="mt-2 text-4xl font-bold">{loading ? '...' : reservedCount}</span>
        </div>
      </div>
    </section>
  );
}