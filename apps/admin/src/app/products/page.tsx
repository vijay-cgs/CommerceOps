import { AdminTabs } from "../../components/admin-tabs";
import { ProductManager } from "../../../../web/src/components/admin/product-manager";

export default function AdminProductsZonePage() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <AdminTabs />
      <ProductManager />
    </section>
  );
}
