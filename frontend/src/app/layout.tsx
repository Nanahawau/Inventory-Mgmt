import './globals.css';
import Header from '../components/ui/header';
import Footer from '../components/ui/footer';
import React from 'react';

export const metadata = {
  title: 'Inventory Management',
  description: 'Inventory Management app',
};

// Root layout: do NOT render Sidebar here. Reserved for dashboard nested layout.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <Header />
        <main className="site-main site-container flex-1 w-full">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}