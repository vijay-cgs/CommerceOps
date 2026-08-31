"use client";

import Link from "next/link";
import type { Product } from "../../lib/storefront-data";
import { formatCurrency } from "../../lib/storefront-data";
import { useCart } from "./cart-provider";

export function ProductDetailView({ product }: { product: Product }) {
  const { addToCart } = useCart();

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/products" className="mb-6 inline-block text-sm font-medium text-slate-700">
        ← Back to products
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div className={`h-[420px] rounded-[2rem] bg-gradient-to-br ${product.accent}`} />
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">{product.category}</p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">{product.name}</h1>
          </div>

          <p className="text-3xl font-bold text-slate-900">{formatCurrency(product.price)}</p>
          <p className="text-lg text-slate-600">{product.description}</p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => addToCart(product)}
              className="rounded-full bg-slate-900 px-6 py-3 font-medium text-white"
              type="button"
            >
              Add to cart
            </button>
            <Link href="/cart" className="rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-800">
              View cart
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">Includes</p>
            <ul className="mt-4 space-y-2 text-slate-700">
              {product.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
