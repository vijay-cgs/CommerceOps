import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { OrderView } from "@commerceops/types";
import { getAuthContext } from "../../../lib/auth";
import { API_BASE_URL } from "../../../lib/session";
import { formatCents } from "../../../lib/money";

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>;
}) {
  const { orderNumber } = await params;
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login");
  }

  const upstream = await fetch(`${API_BASE_URL}/api/v1/orders/${encodeURIComponent(orderNumber)}`, {
    headers: { authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    notFound();
  }

  const payload = (await upstream.json()) as { data?: OrderView };
  const order = payload.data;

  if (!order) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Order confirmed
          </p>
          <h1 className="mt-3 text-3xl font-black tracking-tight">Thank you, {auth.displayName}</h1>
          <p className="mt-2 text-slate-700">
            Your order <span className="font-semibold">{order.orderNumber}</span> has been recorded.
          </p>
        </div>

        <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold">Order summary</h2>

          <ul className="mt-5 divide-y divide-slate-200">
            {order.items.map((item) => (
              <li key={item.sku} className="flex justify-between gap-3 py-3 text-sm">
                <span className="text-slate-700">
                  {item.name}
                  {item.optionValue ? ` (${item.optionValue})` : ""} × {item.quantity}
                </span>
                <span className="font-medium">{formatCents(item.lineTotalCents)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-700">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCents(order.subtotalCents)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>{formatCents(order.shippingCents)}</span>
            </div>
          </div>

          <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatCents(order.totalCents)}</span>
          </div>
        </section>

        <Link
          href="/products"
          className="mt-8 inline-block rounded-full bg-slate-900 px-6 py-3 font-medium text-white"
        >
          Continue shopping
        </Link>
      </div>
    </main>
  );
}
