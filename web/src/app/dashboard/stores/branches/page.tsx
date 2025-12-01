'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { useToast } from '@/context/toast-context';
import { DataTable } from '@/components/ui/DataTable';

type Branch = {
  id: number;
  name: string;
  location?: string;
};

export default function BranchStoresPage() {
  const { push } = useToast();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);

  async function loadBranches() {
    setLoading(true);
    try {
      const res = await api.stores.getBranchStores({ page, pageSize });
      const list: Branch[] = Array.isArray(res.data) ? res.data : [];
      setBranches(list);
      setTotal(res?.meta?.total ?? list.length);
    } catch (e: any) {
      push({ tone: 'error', title: 'Branches', message: e.message || 'Failed to load branches' });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  function onPageChange(p: number) {
    setPage(p);
  }
  function onPageSizeChange(ps: number) {
    setPage(1);
    setPageSize(ps);
  }

  const columns = [
    { key: 'name', header: 'Branch Name' },
    { key: 'location', header: 'Location' },
    {
      key: 'actions',
      header: '',
      render: (b: Branch) => (
        <div className="flex gap-3">
          <Link
            href={`/dashboard/stores/branches/${b.id}/inventory`}
            className="text-sm text-blue-700 hover:underline"
          >
            View Inventory
          </Link>
          <Link
            href={`/dashboard/stores/branches/${b.id}/edit`}
            className="text-sm text-blue-700 hover:underline"
          >
            Edit
          </Link>
        </div>
      ),
      className: 'text-right',
    },
  ];

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold">Branch Stores</h1>
      <DataTable
        columns={columns}
        data={branches}
        emptyText="No branches found."
        page={page}
        pageSize={pageSize}
        total={total}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </section>
  );
}