'use client';
import React, { useState } from 'react';
import type { Product } from '@/types/product';

type Props = {
  product: Product;
  open: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
};

export default function DeleteProductDialog({ product, open, onCancel, onConfirm }: Props) {
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  async function handleDelete() {
    if (input.trim() !== 'DELETE') return;
    setSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setSubmitting(false);
      setInput('');
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
        <h2 className="text-lg font-semibold mb-2">Delete Product</h2>
        <p className="text-sm text-slate-600 mb-4">
          You are about to delete <span className="font-medium">{product.name}</span> containing{' '}
          {(product.skus || []).length} variant(s). This action cannot be undone.
        </p>
        <div className="mb-4 text-sm">
          Type <span className="font-mono bg-slate-100 px-1 rounded">DELETE</span> to confirm.
        </div>
        <input
          autoFocus
            className="w-full rounded border px-3 py-2 text-sm mb-4"
          placeholder="Type DELETE"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="rounded border border-slate-300 px-4 py-2 text-sm hover:bg-slate-100"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={submitting || input.trim() !== 'DELETE'}
            className="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {submitting ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}