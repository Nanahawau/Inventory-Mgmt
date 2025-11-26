import "../app/globals.css";
import "./globals.css";
import { AuthProvider } from '@/context/auth-context';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/ui/header';
import Footer from '@/components/ui/footer';

export const metadata = {
  title: 'Inventory Management',
  description: 'Manage inventory, SKUs and dashboards',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-white text-gray-900">
        <AuthProvider>
          <Header />
          <div className="flex min-h-[calc(100vh-4rem)]">
            <Sidebar />
            <main className="flex-1 p-4">
              {children}
            </main>
          </div>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}