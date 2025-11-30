'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '@/components/features/products/ProductForm';
import api from '@/lib/api';
import type { CreateProductInput } from '@/types/product';
import { useState } from 'react';
import { useToast } from '@/context/toast-context';

export default function NewProductPage() {
  const router = useRouter();
  const { push } = useToast();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data: CreateProductInput) {
    setSaving(true);
    try {
      await api.products.create(data);
      push({ tone: 'success', title: 'Success', message: 'Product created successfully' });
      router.push('/dashboard/products');
    } catch (err: any) {
      const msg = err?.message || 'Create failed';
      push({ tone: 'error', title: 'Create failed', message: msg });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Add product</h1>
      <ProductForm onSubmit={handleSubmit} submitting={saving} cancelHref="/dashboard/products" />
    </section>
  );
}