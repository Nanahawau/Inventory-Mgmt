'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { token, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) {
      router.replace('/');
    }
  }, [loading, token, router]);

  if (loading || !token) return null;

  // Root layout already renders TopNav and <main>; keep this light.   
  return <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>;
}