import React from 'react';
import Sidebar from '@/components/Sidebar';

// Note: nested layouts MUST NOT include <html> or <body> — your root src/app/layout.tsx already provides them.
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <main className="flex-1 p-6 bg-slate-50">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}