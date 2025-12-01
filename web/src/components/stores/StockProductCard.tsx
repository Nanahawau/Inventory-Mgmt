'use client';

import React from 'react';

type SKU = {
  id: number | string;
  skuCode?: string;
  attributes?: Record<string, string>;
  qty?: number | null;
};

type Props = {
  product: any;
  sku?: SKU | null;
  className?: string;
};

/**
 * Defensive StockProductCard
 * - avoids crashing if `sku` is undefined (renders a placeholder / warning)
 * - logs a warning so you can find the caller that passed an invalid sku
 * - preserves the SKU display and navigation when `sku` is present
 */
export default function StockProductCard({ product, sku, className = '' }: Props) {
  if (!sku) {
    // Render a harmless placeholder instead of throwing.
    // Keep this visible so you can spot missing data while testing.
    console.warn('[StockProductCard] called with undefined sku for productId=', product?.id);
    return (
      <div className={`border rounded-md p-3 flex items-center justify-between ${className}`}>
        <div>
          <div className="font-semibold text-slate-900">Missing SKU</div>
          <div className="text-xs text-slate-500 mt-1">No SKU data provided</div>
        </div>
      </div>
    );
  }

    return (
    <div className="rounded border bg-white p-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-medium">{product.name}</h3>
          {product.category ? (
            <p className="text-xs text-slate-500">Category: {product.category}</p>
          ) : null}
          {typeof product.price !== 'undefined' ? (
            <p className="text-xs text-slate-500">Price: {String(product.price)}</p>
          ) : null}
          {product.description ? (
            <p className="mt-1 text-sm text-slate-600">{product.description}</p>
          ) : null}
          <p className="mt-2 text-xs text-slate-500">SKU: {sku.skuCode ?? sku.id}</p>
          {sku.attributes && Object.keys(sku.attributes).length ? (
            <div className="mt-1 text-xs text-slate-500">
              {Object.entries(sku.attributes).map(([k, v]) => (
                <span key={k} className="mr-3">
                  {k}: {v}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}