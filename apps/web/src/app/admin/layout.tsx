import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthContext } from "../../lib/auth";
import { canManageProducts } from "../../lib/roles";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (!canManageProducts(auth.role)) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <nav className="mb-8 flex gap-4 border-b border-slate-200 pb-4 text-sm font-medium">
          <Link href="/admin/products" className="text-slate-900">
            Products
          </Link>
          <Link href="/admin/skus" className="text-slate-600 hover:text-slate-900">
            SKUs
          </Link>
          <Link href="/inventory" className="text-slate-600 hover:text-slate-900">
            Inventory
          </Link>
        </nav>
        {children}
      </div>
    </div>
  );
}
