'use client';

import React, { useState } from 'react';
import AddStoreModal from './AddStoreModal';
import { useRouter } from 'next/navigation';

type Props = {
  // optional callback invoked after a store is created
  onCreated?: (store: any) => void;
};

export default function StoresHeader({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function handleCreated(store: any) {
    // refresh server-rendered data (app router) so new store appears
    try {
      router.refresh();
    } catch (e) {
      // ignore if not available
    }
    onCreated?.(store);
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold">Stores</h1>
        <p className="text-sm text-slate-600">Manage your store locations</p>
      </div>

      <div>
        <button
          onClick={() => setOpen(true)}
          className="rounded bg-black px-4 py-2 text-white"
        >
          Add store
        </button>
      </div>

      <AddStoreModal
        isOpen={open}
        onClose={() => setOpen(false)}
        onCreated={handleCreated}
      />
    </div>
  );
}