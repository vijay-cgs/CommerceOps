"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCart } from "./cart-provider";
import { StorefrontApiError, submitOrder } from "../../lib/catalog-api";
import { formatCents } from "../../lib/money";
import { queryKeys } from "../../lib/query-keys";

const SHIPPING_CENTS = 1200;

export function CheckoutForm({ defaultName }: { defaultName: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { items, itemCount, subtotalCents, isCatalogLoading, clearCart } = useCart();

  const [shippingName, setShippingName] = useState(defaultName);
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Kept stable so retrying a submission cannot create a second order.
  const idempotencyKeyRef = useRef<string | null>(null);

  const orderMutation = useMutation({
    mutationFn: submitOrder,
    onSuccess: async (order) => {
      idempotencyKeyRef.current = null;
      clearCart();
      // Stock changed, so any cached catalog or inventory view is now stale.
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
      router.replace(`/orders/${order.orderNumber}?placed=1`);
    },
    onError: (mutationError) => {
      if (mutationError instanceof StorefrontApiError) {
        if (mutationError.code === "insufficient_stock" || mutationError.code === "out_of_stock") {
          // A fresh key avoids colliding with the rejected attempt.
          idempotencyKeyRef.current = null;
        }
        setError(mutationError.message);
        return;
      }

      setError("We could not place your order. Please try again.");
    },
  });

  const shippingCents = subtotalCents > 0 ? SHIPPING_CENTS : 0;

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    const trimmedShippingName = shippingName.trim();
    const trimmedShippingAddress = shippingAddress.trim();
    const trimmedShippingCity = shippingCity.trim();
    const trimmedShippingPostalCode = shippingPostalCode.trim();

    if (
      trimmedShippingName.length < 2 ||
      trimmedShippingAddress.length < 4 ||
      trimmedShippingCity.length < 2 ||
      trimmedShippingPostalCode.length < 3
    ) {
      setError("Please provide valid shipping details.");
      return;
    }

    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }

    orderMutation.mutate({
      items: items.map((item) => ({
        productId: item.product.id,
        sku: item.variant.sku,
        quantity: item.quantity,
      })),
      shippingName: trimmedShippingName,
      shippingAddress: trimmedShippingAddress,
      shippingCity: trimmedShippingCity,
      shippingPostalCode: trimmedShippingPostalCode,
      idempotencyKey: idempotencyKeyRef.current,
    });
  }

  if (isCatalogLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-slate-600">Loading checkout…</p>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-4xl font-black tracking-tight">Checkout</h1>
        <div className="mt-8 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-semibold">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-3 text-white"
          >
            Continue shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-4xl font-black tracking-tight">Checkout</h1>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Shipping details</h2>

            <label
              className="mt-5 block text-sm font-medium text-slate-700"
              htmlFor="shipping-name"
            >
              Full name
              <input
                id="shipping-name"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
                required
                minLength={2}
                maxLength={120}
                value={shippingName}
                onChange={(event) => setShippingName(event.target.value)}
              />
            </label>

            <label
              className="mt-4 block text-sm font-medium text-slate-700"
              htmlFor="shipping-address"
            >
              Address
              <input
                id="shipping-address"
                className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
                required
                minLength={4}
                maxLength={200}
                autoComplete="street-address"
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
              />
            </label>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="shipping-city">
                City
                <input
                  id="shipping-city"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                  minLength={2}
                  maxLength={80}
                  autoComplete="address-level2"
                  value={shippingCity}
                  onChange={(event) => setShippingCity(event.target.value)}
                />
              </label>
              <label className="text-sm font-medium text-slate-700" htmlFor="shipping-postal">
                ZIP / postal code
                <input
                  id="shipping-postal"
                  className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2"
                  required
                  minLength={3}
                  maxLength={20}
                  autoComplete="postal-code"
                  value={shippingPostalCode}
                  onChange={(event) => setShippingPostalCode(event.target.value)}
                />
              </label>
            </div>
          </section>

          <aside className="rounded-3xl border border-slate-200 bg-white p-6">
            <h2 className="text-xl font-bold">Order summary</h2>

            <ul className="mt-5 space-y-2 text-sm text-slate-700">
              {items.map((item) => (
                <li key={item.variant.sku} className="flex justify-between gap-3">
                  <span>
                    {item.product.name}
                    {item.variant.optionValue ? ` (${item.variant.optionValue})` : ""} ×{" "}
                    {item.quantity}
                  </span>
                  <span>{formatCents(item.variant.priceCents * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-3 border-t border-slate-200 pt-4 text-sm text-slate-700">
              <div className="flex justify-between">
                <span>Items</span>
                <span>{itemCount}</span>
              </div>
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCents(subtotalCents)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{formatCents(shippingCents)}</span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-lg font-bold">
              <span>Total</span>
              <span>{formatCents(subtotalCents + shippingCents)}</span>
            </div>

            {error ? (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium text-red-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={orderMutation.isPending}
              className="mt-6 w-full rounded-full bg-slate-900 px-4 py-3 font-medium text-white disabled:opacity-60"
            >
              {orderMutation.isPending ? "Placing order…" : "Place order"}
            </button>

            <p className="mt-3 text-center text-xs text-slate-500">
              Totals are confirmed by the server before your order is recorded.
            </p>
          </aside>
        </form>
      </div>
    </main>
  );
}
