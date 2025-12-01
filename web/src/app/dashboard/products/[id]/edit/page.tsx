'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductForm from '@/components/features/products/ProductForm';
import api from '@/lib/api';
import type { Product, CreateProductInput } from '@/types/product';
import { useToast } from '@/context/toast-context';

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { push } = useToast();
  const productId = Number(id);
  const [initial, setInitial] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.products.getOne(productId);
        // Normalize price to number if backend returns string
        const normalized = {
          ...data,
          price: data?.price == null ? undefined : Number(data.price),
        } as Product;
        if (active) setInitial(normalized);
      } catch (err: any) {
        const msg = err?.message || 'Load failed';
        if (active) setError(msg);
        push({ tone: 'error', title: 'Load failed', message: msg });
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [productId, push]);

  async function handleSubmit(data: CreateProductInput) {
    setSaving(true);
    try {
      await api.products.update(productId, data);
      push({ tone: 'success', title: 'Success', message: 'Product updated successfully' });
      router.push('/dashboard/products');
    } catch (err: any) {
      const msg = err?.message || 'Update failed';
      push({ tone: 'error', title: 'Update failed', message: msg });
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-sm text-slate-500">Loading…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;
  if (!initial) return <div className="text-sm text-red-600">Not found</div>;

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Edit product</h1>
      <ProductForm
        initial={initial}
        onSubmit={handleSubmit}
        submitting={saving}
        cancelHref="/dashboard/products"
      />
    </section>
  );
}