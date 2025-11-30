'use client';

import React, { useState } from 'react';
import type { Product } from '@/types/product';

type FormSku = {
  skuCode: string;
  color?: string;
  size?: string;
};

type Props = {
  initial?: Product;
  onSubmit: (data: {
    name: string;
    category?: string;
    price?: number;
    description?: string;
    skus: { skuCode: string; attributes?: Record<string, string> }[];
  }) => void;
  submitting?: boolean;
  cancelHref: string;
};

export default function ProductForm({ initial, onSubmit, submitting, cancelHref }: Props) {
  const initialSkus: FormSku[] =
    (initial?.skus ?? []).map(s => ({
      skuCode: s.skuCode,
      color: s.attributes?.color,
      size: s.attributes?.size
    })) || [{ skuCode: '', color: '', size: '' }];

  const [form, setForm] = useState({
    name: initial?.name ?? '',
    category: initial?.category ?? '',
    price: initial?.price ?? undefined as number | undefined,
    description: initial?.description ?? '',
    skus: initialSkus
  });

  const updateField = (k: keyof typeof form, v: any) => setForm(f => ({ ...f, [k]: v }));
  const updateSku = (i: number, patch: Partial<FormSku>) =>
    setForm(f => {
      const next = [...f.skus];
      next[i] = { ...next[i], ...patch };
      return { ...f, skus: next };
    });

  const addSku = () => setForm(f => ({ ...f, skus: [...f.skus, { skuCode: '', color: '', size: '' }] }));
  const removeSku = (i: number) =>
    setForm(f => {
      const next = [...f.skus];
      next.splice(i, 1);
      return { ...f, skus: next.length ? next : [{ skuCode: '', color: '', size: '' }] };
    });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payloadSkus = form.skus.map(s => {
      const attributes: Record<string, string> = {};
      if (s.color?.trim()) attributes.color = s.color.trim();
      if (s.size?.trim()) attributes.size = s.size.trim();
      return {
        skuCode: s.skuCode.trim(),
        attributes: Object.keys(attributes).length ? attributes : undefined
      };
    });
    onSubmit({
      name: form.name,
      category: form.category || undefined,
      price: form.price,
      description: form.description || undefined,
      skus: payloadSkus
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          className="w-full rounded border px-3 py-2"
          value={form.name}
          onChange={e => updateField('name', e.target.value)}
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <input
            className="w-full rounded border px-3 py-2"
            value={form.category}
            onChange={e => updateField('category', e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Base Price</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded border px-3 py-2"
            value={form.price ?? ''}
            onChange={e => updateField('price', e.target.value === '' ? undefined : Number(e.target.value))}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          rows={3}
          className="w-full rounded border px-3 py-2"
          value={form.description}
          onChange={e => updateField('description', e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold">Variants</h3>
          <button type="button" onClick={addSku} className="rounded bg-slate-900 text-white px-3 py-1.5 text-sm">
            Add variant
          </button>
        </div>

        <div className="space-y-4">
          {form.skus.map((sku, i) => (
            <div key={i} className="border rounded p-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div>
                  <label className="block text-xs font-medium mb-1">SKU Code</label>
                  <input
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={sku.skuCode}
                    onChange={e => updateSku(i, { skuCode: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Color</label>
                  <input
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={sku.color ?? ''}
                    onChange={e => updateSku(i, { color: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Size</label>
                  <input
                    className="w-full rounded border px-2 py-1.5 text-sm"
                    value={sku.size ?? ''}
                    onChange={e => updateSku(i, { size: e.target.value })}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => removeSku(i)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={submitting} className="rounded bg-blue-600 text-white px-4 py-2 disabled:opacity-50">
          {submitting ? 'Saving…' : 'Save'}
        </button>
        <a href={cancelHref} className="text-sm text-slate-700 hover:underline">
          Cancel
        </a>
      </div>
    </form>
  );
}