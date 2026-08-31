import { redirect } from "next/navigation";
import { CheckoutForm } from "../../components/storefront/checkout-form";
import { getAuthContext } from "../../lib/auth";

export default async function CheckoutPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login?next=/checkout");
  }

  return <CheckoutForm defaultName={auth.displayName} />;
}
