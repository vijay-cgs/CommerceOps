"use client";

import Link from "next/link";
import type { ProductView } from "@commerceops/types";
import { formatCents } from "../../lib/money";
import { useCart } from "./cart-provider";

export function ProductCard({ product }: { product: ProductView }) {
  const { addToCart } = useCart();

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <Link href={`/product/${product.slug}`} className="block">
        <div className={`h-48 bg-gradient-to-br ${product.accent}`} />
      </Link>
      <div className="space-y-4 p-5">
        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
          {product.tag}
        </span>
        <div className="flex items-center justify-between gap-3">
          <Link href={`/product/${product.slug}`} className="text-xl font-semibold text-slate-900">
            {product.name}
          </Link>
          <span className="text-lg font-bold">{formatCents(product.priceCents)}</span>
        </div>
        <p className="text-sm text-slate-600">{product.description}</p>
        <button
          onClick={() => addToCart(product)}
          className="w-full rounded-full border border-slate-300 bg-slate-900 px-4 py-2.5 font-medium text-white"
          type="button"
        >
          Add to cart
        </button>
      </div>
    </article>
  );
}
