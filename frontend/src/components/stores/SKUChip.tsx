'use client';

import React from 'react';
import Link from 'next/link';

type SKU = {
  id: number | string;
  skuCode?: string;
  attributes?: Record<string, string>;
  quantity?: number;
  productId?: number | string;
};

export default function SKUChip({
  sku,
  editable = false,
  onAdjust,
}: {
  sku: SKU;
  editable?: boolean;
  onAdjust?: (sku: SKU) => void;
}) {
  return (
    <div className="border rounded-md p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="flex items-start gap-4 min-w-0">
        <div className="flex-shrink-0">
          <div className="w-14 h-14 flex items-center justify-center rounded-md bg-slate-50 border border-slate-100 text-sm font-medium text-slate-800 text-center">
            {sku.skuCode ?? '—'}
          </div>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <div className="text-sm font-semibold text-slate-900 truncate">{sku.skuCode ?? '—'}</div>
            {sku.attributes && (
              <div className="text-xs text-slate-500 truncate">
                {Object.entries(sku.attributes)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(' • ')}
              </div>
            )}
          </div>

          <div className="mt-2 flex items-center gap-4 text-xs text-slate-400">
            <div>ID: {String(sku.id)}</div>
            <div>Qty: {sku.quantity ?? '—'}</div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {editable ? (
          <button
            type="button"
            onClick={() => onAdjust && onAdjust(sku)}
            className="px-3 py-1 rounded-md bg-slate-800 text-white text-sm hover:bg-slate-900"
          >
            Adjust
          </button>
        ) : sku.productId ? (
          <Link
            href={`/dashboard/products/${sku.productId}`}
            className="px-3 py-1 rounded-md bg-slate-50 border text-sm text-slate-700 hover:bg-slate-100"
          >
            Open in Product
          </Link>
        ) : (
          <span className="px-3 py-1 rounded-md bg-slate-50 border text-sm text-slate-500">View</span>
        )}
      </div>
    </div>
  );
}