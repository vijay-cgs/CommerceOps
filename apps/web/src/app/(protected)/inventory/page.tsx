import { InventoryContextPanel } from "../../../features/inventory/inventory-context-panel";
import { AdminTabs } from "../../../components/admin/admin-tabs";

export default function InventoryPage() {
  return (
    <section>
      <AdminTabs />

      <h1 className="text-3xl font-black tracking-tight">Inventory</h1>
      <p className="mt-1 text-sm text-slate-600">Review stock levels and record adjustments.</p>

      <InventoryContextPanel />
    </section>
  );
}
