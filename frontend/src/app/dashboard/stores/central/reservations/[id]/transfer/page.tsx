// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useToast } from '@/context/toast-context';
// import api from '@/lib/api';

// type Reservation = {
//   id: number;
//   inventoryItemId: number;
//   skuId: number;
//   quantity: number;
//   status: string;
//   inventoryItem?: { product?: { name?: string } };
//   sku?: { skuCode?: string };
//   createdAt?: string;
// };

// export default function TransferReservationPage() {
//   const { id } = useParams() as { id: string };
//   const router = useRouter();
//   const { push } = useToast();

//   const [reservation, setReservation] = useState<Reservation | null>(null);
//   const [loading, setLoading] = useState(true);

//   const [toStoreId, setToStoreId] = useState<number | ''>('');
//   const [quantity, setQuantity] = useState<number | ''>('');

//   // Fetch reservation (replace with GET /stock/reservations/:id if available)
//   useEffect(() => {
//     async function load() {
//       setLoading(true);
//       try {
//         // Fetch a page that should contain the reservation; if not, broaden
//         const res: any = await api.stock.listReservations({ page: 1, pageSize: 50 });
//         const payload = res?.data ?? res;
//         const list = payload?.data ?? [];
//         const found = list.find((r: any) => Number(r.id) === Number(id));
//         if (!found) {
//           push({ tone: 'error', title: 'Reservation', message: 'Not found' });
//         } else {
//           const mapped: Reservation = {
//             id: found.id,
//             inventoryItemId: found.inventoryItemId ?? found.inventoryItem?.id,
//             skuId: found.skuId ?? found.sku?.id,
//             quantity: found.quantity,
//             status: found.status,
//             inventoryItem: found.inventoryItem,
//             sku: found.sku,
//             createdAt: found.createdAt,
//           };
//           setReservation(mapped);
//           setQuantity(mapped.quantity);
//         }
//       } catch (e: any) {
//         push({ tone: 'error', title: 'Load', message: e.message });
//       } finally {
//         setLoading(false);
//       }
//     }
//     load();
//   }, [id, push]);

//   async function onTransfer() {
//     if (!reservation) return;
//     if (!toStoreId || Number(toStoreId) <= 0) {
//       push({ tone: 'error', title: 'Transfer', message: 'Enter a valid destination store ID' });
//       return;
//     }
//     const qtyNum = Number(quantity);
//     if (!qtyNum || qtyNum <= 0 || qtyNum > reservation.quantity) {
//       push({ tone: 'error', title: 'Transfer', message: 'Invalid quantity' });
//       return;
//     }
//     try {
//       // await api.stock.transferReservation({
//       //   toStoreId: Number(toStoreId),
//       //   quantity: qtyNum,
//       // });
//       push({ tone: 'success', title: 'Transfer', message: 'Reservation transferred' });
//       router.push('/dashboard/stores/central/reservations');
//     } catch (e: any) {
//       push({ tone: 'error', title: 'Transfer failed', message: e.message });
//     }
//   }

//   return (
//     <section className="space-y-6 max-w-md">
//       <div className="flex items-center justify-between">
//         <h1 className="text-xl font-semibold">Transfer Reservation</h1>
//         <button
//           onClick={() => router.back()}
//           className="text-sm text-blue-700 hover:underline"
//         >
//           Back
//         </button>
//       </div>

//       {loading ? (
//         <div className="text-sm text-slate-600">Loading reservation...</div>
//       ) : !reservation ? (
//         <div className="text-sm text-red-600">Reservation not found.</div>
//       ) : (
//         <>
//           <div className="space-y-1 text-sm">
//             <p><span className="font-medium">ID:</span> {reservation.id}</p>
//             <p><span className="font-medium">Product:</span> {reservation.inventoryItem?.product?.name || '—'}</p>
//             <p><span className="font-medium">SKU:</span> {reservation.sku?.skuCode || '—'}</p>
//             <p><span className="font-medium">Reserved Qty:</span> {reservation.quantity}</p>
//             <p><span className="font-medium">Status:</span> {reservation.status}</p>
//           </div>

//             <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium">Destination Store ID</label>
//               <input
//                 type="number"
//                 className="mt-1 w-full rounded border p-2"
//                 value={toStoreId as any}
//                 onChange={(e) => setToStoreId(e.target.value ? Number(e.target.value) : '')}
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium">Quantity to Transfer</label>
//               <input
//                 type="number"
//                 min={1}
//                 max={reservation.quantity}
//                 className="mt-1 w-full rounded border p-2"
//                 value={quantity as any}
//                 onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : '')}
//               />
//               <p className="mt-1 text-xs text-slate-600">Must be ≤ {reservation.quantity}</p>
//             </div>
//             <div className="flex gap-3">
//               <button
//                 onClick={onTransfer}
//                 className="inline-flex items-center rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
//                 disabled={reservation.status !== 'active'}
//               >
//                 Transfer
//               </button>
//               <button
//                 onClick={() => router.push('/dashboard/stores/central/reservations')}
//                 className="inline-flex items-center rounded border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
//               >
//                 Cancel
//               </button>
//             </div>
//           </div>
//         </>
//       )}
//     </section>
//   );
// }