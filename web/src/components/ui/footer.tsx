export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-8">
      <div className="site-container py-6 text-sm text-slate-500">
        © {new Date().getFullYear()} InventoryMgmt — Built with care.
      </div>
    </footer>
  );
}