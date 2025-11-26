import React from 'react';
import './globals.css';
import { Toaster } from 'sonner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground">
        <main className="container mx-auto p-6">{children}</main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}