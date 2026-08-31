"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "../../components/storefront/cart-provider";
import { formatCurrency } from "../../lib/storefront-data";

export default function CheckoutPage() {
  const { items, subtotal, itemCount } = useCart();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            CommerceCart
          </Link>
          <Link href="/cart" className="text-sm font-medium text-slate-700">
            Back to cart
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-4xl font-black tracking-tight">Checkout</h1>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Shipping details</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                First name
                <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" defaultValue="Ava" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                Last name
                <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" defaultValue="Stone" />
              </label>
            </div>
            <label className="mt-4 block text-sm font-medium text-slate-700">
              Address
              <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" defaultValue="158 Market Street" />
            </label>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                City
                <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" defaultValue="Austin" />
              </label>
              <label className="text-sm font-medium text-slate-700">
                ZIP code
                <input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2" defaultValue="78701" />
              </label>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Order summary</h2>
            <div className="mt-5 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{items.length ? "$12.00" : "$0.00"}</span>
              </div>
            </div>
            <div className="mt-5 border-t border-slate-200 pt-4">
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(subtotal + (items.length ? 12 : 0))}</span>
              </div>
            </div>
            <button className="mt-6 w-full rounded-full bg-slate-900 px-4 py-3 font-medium text-white" type="button">
              Place order
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
}
