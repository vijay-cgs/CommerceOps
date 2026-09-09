import { redirect } from "next/navigation";
import { getAuthContext } from "../../lib/auth";
import { canManageProducts } from "../../lib/roles";
import { AdminTabs } from "../../components/admin/admin-tabs";

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
        <AdminTabs />
        {children}
      </div>
    </div>
  );
}
