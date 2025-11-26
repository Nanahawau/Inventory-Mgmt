'use client';

import React, { useState } from 'react';
import SKUChip from './SKUChip';
import SKUEditModal from './SKUEditModal';

type SKU = {
  id: number | string;
  skuCode?: string;
  attributes?: Record<string, string>;
  quantity?: number;
  productId?: number | string;
};

type Product = {
  id: number | string;
  name: string;
  category?: string;
  price?: string | number;
  description?: string;
  skus?: SKU[];
};

function formatPrice(p: string | number | undefined) {
  if (p == null || p === '') return '—';
  const n = typeof p === 'number' ? p : Number(p);
  if (Number.isNaN(n)) return String(p);
  return n.toLocaleString(undefined, { style: 'currency', currency: 'USD' });
}

export default function StoreProductCard({
  product,
  editable = false,
}: {
  product: Product;
  // editable = true when shown in Products section (allows direct SKU edits)
  editable?: boolean;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSku, setActiveSku] = useState<SKU | null>(null);
  const [skus, setSkus] = useState<SKU[] | undefined>(product.skus);

  function handleAdjust(sku: SKU) {
    if (!editable) {
      // In stores view we shouldn't edit: navigate to product details by link from SKUChip
      return;
    }
    setActiveSku(sku);
    setModalOpen(true);
  }

  function onSaved(updated: SKU) {
    // update local state so the UI reflects the changed SKU immediately
    setSkus((prev) => (prev ? prev.map((s) => (String(s.id) === String(updated.id) ? { ...s, ...updated } : s)) : prev));
  }

  return (
    <article className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-slate-900 truncate">{product.name}</h3>
          <div className="mt-1 text-xs text-slate-500">
            ID: {product.id} {product.category ? `• ${product.category}` : ''}
          </div>
          {product.description ? (
            <p className="mt-3 text-sm text-slate-600">{product.description}</p>
          ) : null}
        </div>

        <div className="flex items-start gap-3">
          <div className="text-right">
            <div className="text-sm text-slate-500">Price</div>
            <div className="text-lg font-semibold text-slate-900">{formatPrice(product.price)}</div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-slate-700">SKUs</div>
          <div className="text-xs text-slate-400">Total: {(skus?.length ?? 0)}</div>
        </div>

        {skus && skus.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {skus.map((s) => (
              <SKUChip key={s.id} sku={{ ...s, productId: product.id }} editable={editable} onAdjust={handleAdjust} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">No SKUs for this product.</div>
        )}
      </div>

      {editable && (
        <SKUEditModal
          open={modalOpen}
          sku={activeSku}
          onClose={() => {
            setModalOpen(false);
            setActiveSku(null);
          }}
          onSaved={onSaved}
        />
      )}
    </article>
  );
}