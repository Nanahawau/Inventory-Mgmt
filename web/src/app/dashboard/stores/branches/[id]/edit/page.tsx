'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/toast-context';

export default function BranchStoreEditPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { push } = useToast();

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadBranch() {
      setLoading(true);
      try {
        const res = await api.stores.getOne(id);
        setName(res?.name ?? '');
        setLocation(res?.location ?? '');
      } catch (e: any) {
        push({ tone: 'error', title: 'Branch', message: e.message || 'Failed to load branch' });
      } finally {
        setLoading(false);
      }
    }
    loadBranch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.stores.update(id, { name, location });
      push({ tone: 'success', title: 'Branch', message: 'Branch updated' });
      router.push('/dashboard/stores/branches');
    } catch (e: any) {
      push({ tone: 'error', title: 'Update failed', message: e.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Edit Branch Store</h1>
        <a href="/dashboard/stores/branches" className="text-sm text-blue-700 hover:underline">
          Back
        </a>
      </div>
      <form
        onSubmit={onSave}
        className="rounded border bg-white p-4 space-y-4 max-w-md"
      >
        <div>
          <label className="block text-sm font-medium">Store name</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading || submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Location</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={location}
            onChange={e => setLocation(e.target.value)}
            disabled={loading || submitting}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-70"
            disabled={submitting || loading}
          >
            {submitting ? 'Saving...' : 'Save'}
          </button>
          <a href="/dashboard/stores/branches" className="rounded border px-4 py-2 text-sm">
            Cancel
          </a>
        </div>
      </form>
    </section>
  );
}