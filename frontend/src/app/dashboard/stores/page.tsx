'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { listStores } from '@/lib/api';

export default function StoresPage() {
  const { token } = useAuth();
  const [stores, setStores] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    listStores(token).then(setStores).catch((e) => setError(e.message));
  }, [token]);

  if (!token) return <div>Please log in to manage stores.</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <section>
      <h1 className="text-2xl font-semibold mb-4">Stores</h1>
      {stores.length === 0 ? (
        <div>No stores yet.</div>
      ) : (
        <ul className="space-y-2">
          {stores.map((s) => (
            <li key={s.id}>{s.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}