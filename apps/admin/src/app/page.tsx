import { commerceZoneRoutes } from "@commerceops/mfe-contracts";
import styles from "./page.module.css";

export default function AdminZonePage() {
  return (
    <main className={styles.page}>
      <p className={styles.eyebrow}>CommerceOps zone</p>
      <h1 className={styles.title}>Admin and Operations</h1>
      <p className={styles.copy}>
        This independently runnable zone owns products, SKUs, and inventory. Existing admin routes
        remain in apps/web until they are migrated here.
      </p>
      <p className={styles.route}>Route prefix: {commerceZoneRoutes.admin.pathPrefix}</p>
    </main>
  );
}
