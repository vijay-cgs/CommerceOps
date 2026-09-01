"use client";

import Link from "next/link";
import type { ProductView } from "@commerceops/types";
import { formatCents } from "../../lib/money";
import { useCart } from "./cart-provider";

function priceLabel(product: ProductView): string {
  const prices = product.variants.map((variant) => variant.priceCents);
  const low = Math.min(...prices);
  const high = Math.max(...prices);

  return low === high ? formatCents(low) : `${formatCents(low)} – ${formatCents(high)}`;
}

export function ProductCard({ product }: { product: ProductView }) {
  const { addToCart } = useCart();

  const sellable = product.variants.filter((variant) => variant.isActive);
  const inStock = sellable.filter((variant) => variant.availableQty > 0);
  const hasChoice = sellable.length > 1;

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
          <span className="text-lg font-bold">{priceLabel(product)}</span>
        </div>
        <p className="text-sm text-slate-600">{product.description}</p>

        {inStock.length === 0 ? (
          <p className="rounded-full bg-slate-100 px-4 py-2.5 text-center text-sm font-medium text-slate-500">
            Sold out
          </p>
        ) : hasChoice ? (
          <Link
            href={`/product/${product.slug}`}
            className="block w-full rounded-full border border-slate-300 bg-slate-900 px-4 py-2.5 text-center font-medium text-white"
          >
            Choose {product.optionName ?? "option"}
          </Link>
        ) : (
          <button
            onClick={() => addToCart(inStock[0])}
            className="w-full rounded-full border border-slate-300 bg-slate-900 px-4 py-2.5 font-medium text-white"
            type="button"
          >
            Add to cart
          </button>
        )}
      </div>
    </article>
  );
}
