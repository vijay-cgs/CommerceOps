import { AdminTabs } from "../../../components/admin/admin-tabs";
import { SkuManager } from "../../../components/admin/sku-manager";

export default function InventoryPage() {
  return (
    <section>
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
