import { InventoryContextPanel } from "../../../features/inventory/inventory-context-panel";

export default function InventoryPage() {
  return (
    <section>
      <h2 className="text-xl font-semibold">Inventory</h2>
      <p className="mt-2 text-gray-700">
        INV-US001 context baseline is active with TanStack Query-owned server state.
      </p>
      <InventoryContextPanel />
    </section>
  );
}
