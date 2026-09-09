"use client";

import Link from "next/link";
import { useCart } from "../../components/storefront/cart-provider";
import { formatCents } from "../../lib/money";

export default function CartPage() {
  const {
    items,
    itemCount,
    subtotalCents,
    isCatalogLoading,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Cart</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight">Your basket</h1>
          </div>
          {items.length > 0 ? (
            <button
              onClick={clearCart}
              className="text-sm font-medium text-slate-700"
              type="button"
            >
              Clear cart
            </button>
          ) : null}
        </div>

        {isCatalogLoading ? (
          <p className="text-slate-600">Loading your cart…</p>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold">Your cart is empty.</p>
            <Link
              href="/products"
              className="mt-4 inline-block rounded-full bg-slate-900 px-5 py-3 text-white"
            >
              Continue shopping
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-4">
              {items.map(({ product, variant, quantity }) => (
                <div
                  key={`${product.id}:${variant.sku}`}
                  className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-20 w-20 rounded-2xl bg-gradient-to-br ${product.accent}`} />
                    <div>
                      <p className="font-semibold text-slate-900">{product.name}</p>
                      {variant.optionValue ? (
                        <p className="text-sm text-slate-600">
                          {product.optionName}: {variant.optionValue}
                        </p>
                      ) : null}
                      <p className="text-sm text-slate-600">
                        {formatCents(variant.priceCents)} each
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateQuantity(`${product.id}:${variant.sku}`, -1)}
                      className="h-8 w-8 rounded-full border border-slate-300"
                      type="button"
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-medium">{quantity}</span>
                    <button
                      onClick={() => updateQuantity(`${product.id}:${variant.sku}`, 1)}
                      className="h-8 w-8 rounded-full border border-slate-300"
                      type="button"
                    >
                      +
                    </button>
                    <button
                      onClick={() => removeFromCart(`${product.id}:${variant.sku}`)}
                      className="ml-2 text-sm font-medium text-red-600"
                      type="button"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="rounded-3xl border border-slate-200 bg-white p-6">
              <h2 className="text-xl font-bold">Summary</h2>
              <div className="mt-6 space-y-3 text-sm text-slate-700">
                <div className="flex justify-between">
                  <span>Items</span>
                  <span>{itemCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCents(subtotalCents)}</span>
                </div>
              </div>
              <Link
                href="/checkout"
                className="mt-8 block w-full rounded-full bg-slate-900 px-4 py-3 text-center font-medium text-white"
              >
                Proceed to checkout
              </Link>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
