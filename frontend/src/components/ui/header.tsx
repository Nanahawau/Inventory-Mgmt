import Link from "next/link";

export default function Header() {
  return (
    <header className="site-header">
      <div className="site-container flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-primary-500 flex items-center justify-center text-white font-bold">
            IM
          </div>
          <span className="text-lg font-semibold">InventoryMgmt</span>
        </Link>

        <nav className="flex items-center gap-3">
          <Link href="/sku" className="text-sm text-slate-700 hover:text-slate-900">SKUs</Link>
          <Link href="/reports" className="text-sm text-slate-700 hover:text-slate-900">Reports</Link>
          <Link href="/settings" className="text-sm text-slate-700 hover:text-slate-900">Settings</Link>
        </nav>
      </div>
    </header>
  );
}