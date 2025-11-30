'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { DataTable } from '@/components/ui/DataTable';

type ReservationRow = {
    id: number;
    inventoryItemId: number;
    productId?: number;
    skuId: number;
    skuCode?: string;
    skuAttributes?: string;
    quantity: number;
    status: 'active' | 'fulfilled' | 'cancelled';
    createdAt?: string;
    expiresAt?: string | null;
    reference?: string;
};

type StoreOption = { id: number; name: string };

function isExpired(r: ReservationRow) {
    if (r.status !== 'active') return false;
    if (!r.expiresAt) return false;
    return new Date(r.expiresAt).getTime() <= Date.now();
}

export default function CentralReservationsPage() {
    const { push } = useToast();

    const [rows, setRows] = useState<ReservationRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [total, setTotal] = useState(0);

    // Branch stores
    const [stores, setStores] = useState<StoreOption[]>([]);
    const [storesLoading, setStoresLoading] = useState(false);

    // Transfer modal state
    const [showTransferModal, setShowTransferModal] = useState(false);
    const [transferTarget, setTransferTarget] = useState<ReservationRow | null>(null);
    const [selectedStoreId, setSelectedStoreId] = useState<number | ''>('');
    const [transferSubmitting, setTransferSubmitting] = useState(false);

    async function loadReservations() {
        setLoading(true);
        try {
            const res: any = await api.stock.listReservations({ page, pageSize });
            const list: any[] = Array.isArray(res?.data)
                ? res.data
                : Array.isArray(res)
                    ? res
                    : Array.isArray(res?.data?.data)
                        ? res.data.data
                        : [];
            const meta = res?.meta || {};
            const mapped: ReservationRow[] = list.map((r: any) => ({
                id: r.id,
                inventoryItemId: r.inventoryItem?.id ?? r.inventoryItemId,
                productId: r.sku?.product?.id,
                skuId: r.sku?.id ?? r.skuId,
                skuCode: r.sku?.skuCode,
                skuAttributes: JSON.stringify(r.sku?.attributes),
                quantity: r.quantity,
                status: r.status,
                createdAt: r.createdAt,
                expiresAt: r.expiresAt ?? null,
            }));
            setRows(mapped);
            setTotal(meta.total ?? mapped.length);
        } catch (e: any) {
            push({ tone: 'error', title: 'Reservations', message: e.message || 'Failed to load reservations' });
        } finally {
            setLoading(false);
        }
    }

    async function loadBranchStores() {
        setStoresLoading(true);
        try {
            const res = await api.stores.getBranchStores();
            let options: StoreOption[]
            if (res.data && res.data.length > 0) {
                options = res.data.map((s: any) => ({
                    id: s.id,
                    name: s.name || `Store ${s.id}`,
                }));
              
                setStores(options);
            }
        } catch (e: any) {
            push({ tone: 'error', title: 'Stores', message: e.message || 'Failed to load stores' });
        } finally {
            setStoresLoading(false);
        }
    }

    useEffect(() => {
        loadBranchStores();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        loadReservations();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

    function onPageChange(p: number) {
        setPage(p);
    }
    function onPageSizeChange(ps: number) {
        setPage(1);
        setPageSize(ps);
    }

    async function onCancel(id: number) {
        try {
            await api.stock.cancelReservation(id);
            push({ tone: 'success', title: 'Reservation', message: 'Cancelled' });
            await loadReservations();
        } catch (e: any) {
            push({ tone: 'error', title: 'Cancel failed', message: e.message });
        }
    }

    function openTransferModal(r: ReservationRow) {
        setTransferTarget(r);
        setSelectedStoreId(stores.length ? stores[0].id : '');
        setShowTransferModal(true);
    }

    function closeTransferModal() {
        setShowTransferModal(false);
        setTransferTarget(null);
        setSelectedStoreId('');
    }

    async function submitTransfer() {
        if (!transferTarget) return;
        const expired = isExpired(transferTarget);
        if (transferTarget.status !== 'active' || expired) {
            push({
                tone: 'error',
                title: 'Transfer',
                message: expired ? 'Reservation expired' : 'Only active reservations can be transferred',
            });
            return;
        }
        if (!selectedStoreId) {
            push({ tone: 'error', title: 'Transfer', message: 'Select a destination store' });
            return;
        }
        setTransferSubmitting(true);
        try {

            await api.stock.transferReservation({
                centralInventoryItemId: Number(transferTarget.inventoryItemId),
                toStoreId: Number(selectedStoreId),
                productId: Number(transferTarget.productId),
                skuId: Number(transferTarget.skuId),
                quantity: Number(transferTarget.quantity),
                reference: transferTarget.reference,
            });
            push({ tone: 'success', title: 'Transfer', message: 'Transferred to store' });
            closeTransferModal();
            await loadReservations();
        } catch (e: any) {
            push({ tone: 'error', title: 'Transfer failed', message: e.message });
        } finally {
            setTransferSubmitting(false);
        }
    }

    const columns = [
        { key: 'id', header: 'ID' },
        { key: 'skuCode', header: 'SKU' },
        { key: 'skuAttributes', header: 'Attributes' },
        { key: 'quantity', header: 'Qty' },
        {
            key: 'status',
            header: 'Status',
            render: (r: ReservationRow) => {
                const expired = isExpired(r);
                const label = expired ? 'expired' : r.status;
                const cls =
                    r.status === 'active' && !expired
                        ? 'bg-green-100 text-green-800'
                        : r.status === 'active' && expired
                            ? 'bg-red-100 text-red-700'
                            : r.status === 'fulfilled'
                                ? 'bg-blue-100 text-blue-800'
                                : r.status === 'cancelled'
                                    ? 'bg-slate-200 text-slate-700'
                                    : 'bg-slate-100 text-slate-700';
                return (
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${cls}`}>
                        {label}
                    </span>
                );
            },
        },
        {
            key: 'actions',
            header: '',
            render: (r: ReservationRow) => {
                const expired = isExpired(r);
                const transferDisabled = r.status !== 'active' || expired;
                const cancelDisabled = r.status === 'fulfilled' || r.status === 'cancelled';
                return (
                    <div className="flex justify-end gap-3">
                        <button
                            disabled={transferDisabled}
                            onClick={() => {
                                if (transferDisabled) {
                                    push({
                                        tone: 'error',
                                        title: 'Transfer',
                                        message: expired
                                            ? 'Reservation expired'
                                            : 'Only active reservations can be transferred',
                                    });
                                    return;
                                }
                                openTransferModal(r);
                            }}
                            className={`text-sm ${transferDisabled ? 'text-slate-400 cursor-not-allowed' : 'text-blue-700 hover:underline'
                                }`}
                        >
                            transfer
                        </button>
                        <button
                            disabled={cancelDisabled}
                            onClick={() => onCancel(r.id)}
                            className={`text-sm ${cancelDisabled ? 'text-slate-400 cursor-not-allowed' : 'text-red-700 hover:underline'
                                }`}
                        >
                            cancel
                        </button>
                    </div>
                );
            },
            className: 'text-right',
        },
    ];

    return (
        <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Central Reservations</h1>
                <a href="/dashboard/stores/central" className="text-sm text-blue-700 hover:underline">
                    Back to central
                </a>
            </div>

            {loading ? (
                <div className="text-sm text-slate-600">Loading reservations...</div>
            ) : (
                <DataTable
                    columns={columns}
                    data={rows}
                    emptyText="No reservations."
                    page={page}
                    pageSize={pageSize}
                    total={total}
                    onPageChange={onPageChange}
                    onPageSizeChange={onPageSizeChange}
                />
            )}

            {showTransferModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/30" onClick={closeTransferModal} />
                    <div className="relative w-full max-w-md rounded bg-white p-6 shadow-lg">
                        <h2 className="text-lg font-semibold">Transfer Reservation</h2>
                        <p className="mt-1 text-sm text-slate-600">
                            Select a destination store for reservation #{transferTarget?.id}
                        </p>

                        <div className="mt-4">
                            <label className="block text-sm font-medium">Destination Store</label>
                            <select
                                className="mt-1 w-full rounded border p-2"
                                value={selectedStoreId as any}
                                onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : '')}
                                disabled={storesLoading || transferSubmitting}
                            >
                                <option value="" disabled>
                                    {storesLoading ? 'Loading...' : 'Select store'}
                                </option>
                                {stores.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                            {!storesLoading && stores.length === 0 && (
                                <p className="mt-2 text-xs text-red-600">No branch stores available. Create one first.</p>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={closeTransferModal}
                                className="rounded border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                disabled={transferSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={submitTransfer}
                                className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
                                disabled={
                                    transferSubmitting ||
                                    !selectedStoreId ||
                                    !transferTarget ||
                                    storesLoading ||
                                    stores.length === 0
                                }
                            >
                                {transferSubmitting ? 'Transferring...' : 'Transfer'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}