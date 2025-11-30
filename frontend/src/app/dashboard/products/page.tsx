'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import type { Product } from '@/types/product';
import Link from 'next/link';
import { useToast } from '@/context/toast-context';
import DeleteProductDialog from '@/components/features/products/DeleteProductDialog';

export default function ProductsPage() {
    const { push } = useToast();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const canPrev = page > 1;
    const canNext = page < totalPages;

    async function load() {
        setLoading(true);
        setError(null);
        try {
            const res = await api.products.list({ page, pageSize });
            setProducts(res.items);
            setTotal(res.meta?.total); // ensure meta.total used
        } catch (err: any) {
            const msg = err?.message || 'Failed to load products';
            setError(msg);
            push({ tone: 'error', message: msg, title: 'Load failed' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    async function confirmDelete() {
        if (!deleteTarget?.id) return;
        try {
            await api.products.remove(deleteTarget.id);
            push({ tone: 'success', message: 'Product deleted successfully', title: 'Success' });
            // Reload current page (handles last item deletion scenarios)
            await load();
        } catch (err: any) {
            const msg = err?.message || 'Delete failed';
            push({ tone: 'error', message: msg, title: 'Delete failed' });
        } finally {
            setDeleteTarget(null);
        }
    }

    const onPrev = () =>
        setPage((p) => {
            const next = Math.max(1, p - 1)
            return next;
        });

    const onNext = () =>
        setPage((p) => {
            const next = Math.min(totalPages, p + 1);
            return next;
        });
    const onPageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = Number(e.target.value);
        setPageSize(next);
        setPage(1);
    };

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Products</h1>
                <Link href="/dashboard/products/new" className="rounded bg-slate-900 text-white px-4 py-2 text-sm">
                    Add product
                </Link>
            </div>

            {loading && <div className="text-sm text-slate-500">Loading…</div>}
            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="space-y-4">
                {!loading &&
                    products.map((p) => (
                        <div key={p.id} className="rounded border bg-white p-4">
                            <div className="flex items-start justify-between">
                                <div>
                                    <div className="font-medium">{p.name}</div>
                                    <div className="text-sm text-slate-500">
                                        {p.category || '—'} • {(() => {
                                            const n = Number(p.price);
                                            return Number.isFinite(n) ? n.toFixed(2) : '—';
                                        })()} • {(p.skus || []).length} variants
                                    </div>
                                    {p.description && <p className="mt-1 text-sm text-slate-600">{p.description}</p>}
                                </div>
                                <div className="flex gap-3">
                                    <Link href={`/dashboard/products/${p.id}/edit`} className="text-sm text-blue-700 hover:underline">
                                        Edit
                                    </Link>
                                    <button onClick={() => setDeleteTarget(p)} className="text-sm text-red-600 hover:underline">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                {!loading && products.length === 0 && !error && (
                    <div className="rounded border bg-white p-6 text-center text-slate-500">No products yet.</div>
                )}
            </div>

            {/* Pagination controls */}
            <div className="flex items-center justify-between rounded border bg-white p-3">
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onPrev}
                        disabled={!canPrev || loading}
                        className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={onNext}
                        disabled={!canNext || loading}
                        className="rounded border px-3 py-1.5 text-sm disabled:opacity-50"
                    >
                        Next
                    </button>
                    <div className="text-sm text-slate-600 ml-3">
                        Page {page} of {totalPages}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="pageSize" className="text-sm text-slate-600">
                        Rows per page
                    </label>
                    <select
                        id="pageSize"
                        value={pageSize}
                        onChange={onPageSizeChange}
                        className="rounded border px-2 py-1.5 text-sm"
                        disabled={loading}
                    >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={50}>50</option>
                    </select>
                    <div className="text-sm text-slate-600 ml-3">
                        {products.length > 0
                            ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}`
                            : `Showing 0 of ${total}`}
                    </div>
                </div>
            </div>

            <DeleteProductDialog
                product={deleteTarget as Product}
                open={!!deleteTarget}
                onCancel={() => setDeleteTarget(null)}
                onConfirm={confirmDelete}
            />
        </section>
    );
}