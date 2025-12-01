'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (store: any) => void;
};

export default function AddStoreModal({ isOpen, onClose, onCreated }: Props) {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const created = await api.stores.create({ name, location }, token ?? undefined);
      // Notify parent and close
      onCreated?.(created);
      setName('');
      setLocation('');
      onClose();
    } catch (err: any) {
      console.error('[AddStoreModal] create error', err);
      setError(err?.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  }

  return (
    // Simple modal: overlay + centered panel
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => {
          if (!loading) onClose();
        }}
      />

      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-md mx-4 p-6 z-10">
        <h2 className="text-lg font-semibold mb-4">Add store</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mt-1 rounded border px-3 py-2"
              placeholder="e.g., Central"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full mt-1 rounded border px-3 py-2"
              placeholder="e.g., HQ"
            />
          </div>

          {error ? <div className="text-sm text-red-600">{error}</div> : null}

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="rounded px-3 py-2 border"
              onClick={() => {
                if (!loading) onClose();
              }}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}