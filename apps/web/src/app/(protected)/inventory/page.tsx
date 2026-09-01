import Link from "next/link";
import { InventoryContextPanel } from "../../../features/inventory/inventory-context-panel";

export default function InventoryPage() {
  return (
    <section>
      <nav className="mb-8 flex gap-4 border-b border-slate-200 pb-4 text-sm font-medium">
        <Link href="/admin/products" className="text-slate-600 hover:text-slate-900">
          Products
        </Link>
        <Link href="/inventory" className="text-slate-900">
          Inventory
        </Link>
      </nav>

      <h1 className="text-3xl font-black tracking-tight">Inventory</h1>
      <p className="mt-1 text-sm text-slate-600">Review stock levels and record adjustments.</p>

      <InventoryContextPanel />
    </section>
  );
}
