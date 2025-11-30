'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/context/toast-context';
import api from '@/lib/api';

type Product = { id: number; name: string };
type Sku = { id: number; skuCode: string };

export default function CentralAddInventoryPage() {
    const { push } = useToast();
    const router = useRouter();
    const [centralStore, setCentralStore] = useState<any | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [productId, setProductId] = useState<number | ''>('');
    const [skuId, setSkuId] = useState<number | ''>('');
    const [quantity, setQuantity] = useState<number | ''>('');
    const [reference, setReference] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [skuLoading, setSkuLoading] = useState(false);
    const [skus, setSkus] = useState<Sku[]>([]);

    useEffect(() => {
        async function load() {
            setLoading(true);
            try {
                const store = await api.stores.getCentral();
                setCentralStore(store);
                const res = await api.products.list({ page: 1, pageSize: 100 });
                setProducts(res.items.map((p: any) => ({ id: p.id, name: p.name })));
            } catch (e: any) {
                push({ tone: 'error', title: 'Load failed', message: e.message || 'Failed to load data' });
            } finally {
                setLoading(false);
            }
        }
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Fetch SKUs when a product is selected
    useEffect(() => {
        async function loadSkus(pid: number) {
            setSkuLoading(true);
            try {
                const res: any = await api.sku.list({ productId: pid, page: 1, pageSize: 200 });
                const data = (res as any)?.data ?? res;
                const list: Sku[] = Array.isArray(data)
                    ? data.map((s: any) => ({ id: s.id, skuCode: s.skuCode }))
                    : Array.isArray(res?.items)
                        ? res.items.map((s: any) => ({ id: s.id, skuCode: s.skuCode }))
                        : [];
                setSkus(list);
            } catch (e: any) {
                setSkus([]);
                push({ tone: 'error', title: 'SKU load failed', message: e.message || 'Failed to load SKUs' });
            } finally {
                setSkuLoading(false);
            }
        }
        if (productId) {
            loadSkus(productId);
            setSkuId(''); // reset previous selection
        } else {
            setSkus([]);
            setSkuId('');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productId]);

    async function onSubmit() {
        if (!centralStore?.id || !productId || !quantity) {
            push({ tone: 'error', title: 'Validation', message: 'Select product, enter quantity' });
            return;
        }
        setSubmitting(true);
        try {
            const body: any = {
                storeId: centralStore.id,
                productId,
                isCentral: true,
                reference: reference || undefined,
            };
            if (skuId && quantity) {
                body.skuStocks = [{ skuId, stock: Number(quantity) }];
            }
            await api.stock.createInventory(body);
            push({ tone: 'success', title: 'Inventory', message: 'Inventory created' });
            router.push('/dashboard/stores/central');
        } catch (e: any) {
            push({ tone: 'error', title: 'Create failed', message: e.message || 'Failed to create inventory' });
        } finally {
            setSubmitting(false);
        }
    }

    if (loading) return <div className="text-sm text-slate-600">Loading...</div>;

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Add Inventory (Central)</h1>
                <Link href="/dashboard/stores/central" className="text-sm text-blue-700 hover:underline">Back</Link>
            </div>

            <form
                className="rounded border bg-white p-4 space-y-4"
                onSubmit={(e) => {
                    e.preventDefault();
                    onSubmit();
                }}
            >
                <div>
                    <label className="block text-sm font-medium">Product</label>
                    <select
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        value={productId}
                        onChange={(e) => setProductId(e.target.value ? Number(e.target.value) : '')}
                    >
                        <option value="">Select product…</option>
                        {products.map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium">SKU (optional)</label>
                    {skuLoading ? (
                        <div className="text-xs text-slate-500 mt-1">Loading SKUs…</div>
                    ) : (
                        <select
                            className="mt-1 w-full rounded border px-3 py-2 text-sm"
                            value={skuId}
                            onChange={(e) => setSkuId(e.target.value ? Number(e.target.value) : '')}
                            disabled={!productId || skus.length === 0}
                        >
                            <option value="">{skus.length ? 'Select SKU…' : 'No SKUs for product'}</option>
                            {skus.map((s) => (
                                <option key={s.id} value={s.id}>{s.skuCode}</option>
                            ))}
                        </select>
                    )}
                    <p className="text-xs text-slate-500 mt-1">Leave empty to create inventory without per-SKU stock.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium">Quantity</label>
                    <input
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        placeholder="e.g., 25"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium">Reference (optional)</label>
                    <input
                        className="mt-1 w-full rounded border px-3 py-2 text-sm"
                        placeholder="Optional reference"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="rounded bg-slate-900 text-white px-4 py-2 text-sm disabled:opacity-50"
                    >
                        {submitting ? 'Adding...' : 'Add'}
                    </button>
                    <Link href="/dashboard/stores/central" className="rounded border px-4 py-2 text-sm">
                        Cancel
                    </Link>
                </div>
            </form>
        </section>
    );
}



