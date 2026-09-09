import Link from "next/link";
import { redirect } from "next/navigation";
import type { OrderListResponse } from "@commerceops/types";
import { getAuthContext } from "../../lib/auth";
import { formatCents } from "../../lib/money";
import { API_BASE_URL } from "../../lib/session";

type OrdersPayload = { data?: OrderListResponse };

export default async function OrdersPage() {
  const auth = await getAuthContext();

  if (!auth) {
    redirect("/login?next=/orders");
  }

  const upstream = await fetch(`${API_BASE_URL}/api/v1/orders`, {
    headers: { authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });

  if (!upstream.ok) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <h1 className="text-4xl font-black tracking-tight">Your orders</h1>
          <div className="mt-8 rounded-3xl border border-red-200 bg-red-50 p-6 text-red-800">
            <p className="font-semibold">We could not load your orders.</p>
            <p className="mt-1 text-sm">Please try again in a moment.</p>
          </div>
        </div>
      </main>
    );
  }

  const payload = (await upstream.json()) as OrdersPayload;
  const orders = payload.data?.orders ?? [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Account</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Your orders</h1>
            <p className="mt-2 text-slate-600">Review your recent purchases, {auth.displayName}.</p>
          </div>
          <Link
            href="/products"
            className="rounded-full bg-slate-900 px-5 py-3 font-medium text-white"
          >
            Continue shopping
          </Link>
        </div>

        {orders.length === 0 ? (
          <section className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold">No orders yet</h2>
            <p className="mt-2 text-slate-600">Your completed purchases will appear here.</p>
            <Link
              href="/products"
              className="mt-6 inline-block rounded-full bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <ul className="mt-8 space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="rounded-3xl border border-slate-200 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-bold">{order.orderNumber}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold capitalize text-emerald-800">
                    {order.status}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-600">
                    {order.items.length} {order.items.length === 1 ? "item" : "items"}
                  </p>
                  <div className="text-right">
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-xl font-bold">{formatCents(order.totalCents)}</p>
                  </div>
                </div>

                <Link
                  href={`/orders/${order.orderNumber}`}
                  className="mt-5 inline-block text-sm font-semibold text-sky-700 hover:text-sky-900"
                >
                  View order details
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
