'use client';

import React, { useState } from 'react';
import api from '@/lib/api';

type SKU = {
  id: number | string;
  skuCode?: string;
  attributes?: Record<string, string>;
  quantity?: number;
};

export default function SKUEditModal({
  open,
  sku,
  onClose,
  onSaved,
}: {
  open: boolean;
  sku?: SKU | null;
  onClose: () => void;
  onSaved?: (updated: SKU) => void;
}) {
  const [quantity, setQuantity] = useState<number | ''>(sku?.quantity ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // keep local state in sync when sku changes (e.g., modal reopened)
  React.useEffect(() => {
    setQuantity(sku?.quantity ?? '');
    setError(null);
  }, [sku]);

  if (!open || !sku) return null;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const body: any = {};
      if (quantity !== '') body.quantity = Number(quantity);
      const updated = await api.sku.update(String(sku.id), body);
      onSaved && onSaved(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update SKU');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-lg shadow-lg p-6 z-10">
        <h3 className="text-lg font-semibold mb-2">Edit SKU: {sku.skuCode}</h3>
        <div className="text-sm text-slate-600 mb-4">ID: {sku.id}</div>

        <label className="block text-xs font-medium text-slate-700 mb-1">Quantity</label>
        <input
          type="number"
          className="w-full rounded border px-3 py-2 mb-3"
          value={quantity === '' ? '' : String(quantity)}
          onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
        />

        {error ? <div className="text-sm text-red-600 mb-3">{error}</div> : null}

        <div className="flex justify-end gap-2">
          <button className="px-3 py-1 rounded border" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="px-3 py-1 rounded bg-slate-800 text-white"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}