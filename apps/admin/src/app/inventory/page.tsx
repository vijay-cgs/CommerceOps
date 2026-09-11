import { AdminTabs } from "../../components/admin-tabs";
import { SkuManager } from "../../../../web/src/components/admin/sku-manager";

export default function AdminInventoryZonePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <AdminTabs />

      <h1 className="text-3xl font-black tracking-tight">Inventory</h1>
      <p className="mt-1 text-sm text-slate-600">
        Manage SKU details, product links, stock levels, and inventory adjustments.
      </p>

      <div className="mt-8 rounded border border-slate-200 bg-white p-5">
        <SkuManager />
      </div>
    </section>
  );
}
