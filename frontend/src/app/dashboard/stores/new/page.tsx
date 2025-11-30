'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useToast } from '@/context/toast-context';

export default function NewStorePage() {
  const router = useRouter();
  const { push } = useToast();

  const [type, setType] = useState<'central' | 'branch'>('branch');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function onCreate() {
    if (!name.trim()) {
      push({ tone: 'error', title: 'Create Store', message: 'Store name is required' });
      return;
    }
    setSubmitting(true);
    try {
      const body = {
        name: name.trim(),
        location: location.trim(),
        // assuming backend expects isCentral boolean
        isCentral: type === 'central',
      };
      await api.stores.create(body);
      push({ tone: 'success', title: 'Store', message: 'Store created' });
      router.push('/dashboard/stores');
    } catch (e: any) {
      push({ tone: 'error', title: 'Create Store failed', message: e.message || 'Failed to create store' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Add Store</h1>
        <Link href="/dashboard/stores" className="text-sm text-blue-700 hover:underline">Back</Link>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onCreate();
        }}
        className="rounded border bg-white p-4 space-y-4"
      >
        <div>
          <label className="block text-sm font-medium">Store type</label>
          <select
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value === 'central' ? 'central' : 'branch')}
            disabled={submitting}
          >
            <option value="central">Central</option>
            <option value="branch">Branch</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium">Store name</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g., Central Warehouse or Branch A"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Location</label>
          <input
            className="mt-1 w-full rounded border px-3 py-2 text-sm"
            placeholder="e.g., City, Address"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            disabled={submitting}
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-70"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create'}
          </button>
          <Link href="/dashboard/stores" className="rounded border px-4 py-2 text-sm">Cancel</Link>
        </div>
      </form>
    </section>
  );
}