import { redirect } from "next/navigation";
import { getAuthContext } from "../../lib/auth";
import { canAccessInventory } from "../../lib/roles";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  if (!canAccessInventory(auth.role)) {
    redirect("/");
  }

  return <>{children}</>;
}
