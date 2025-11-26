'use client';

import React, { useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!token) {
      router.replace('/');
    }
  }, [token, router]);

  if (!token) return null;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}