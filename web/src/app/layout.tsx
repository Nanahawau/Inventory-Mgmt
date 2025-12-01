import './globals.css';
import React from 'react';
import TopNav from '@/components/TopNav';
import { ToastProvider } from '@/context/toast-context';

export const metadata = {
  title: 'Inventory Management App',
  description: 'Inventory management dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
       <body className="min-h-screen bg-slate-50">
         <ToastProvider>
           <TopNav />
           <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
         </ToastProvider>
       </body>
    </html>
   );
}