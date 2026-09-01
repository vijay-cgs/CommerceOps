"use client";

import Link from "next/link";
import { useState } from "react";
import type { ProductView } from "@commerceops/types";
import { formatCents } from "../../lib/money";
import { useCart } from "./cart-provider";

export function ProductDetailView({ product }: { product: ProductView }) {
  const { addToCart } = useCart();
  const sellable = product.variants.filter((variant) => variant.isActive);

  const [selectedSku, setSelectedSku] = useState(
    () => sellable.find((variant) => variant.availableQty > 0)?.sku ?? sellable[0]?.sku ?? "",
  );

  const selected = sellable.find((variant) => variant.sku === selectedSku);
  const outOfStock = !selected || selected.availableQty < 1;

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/products" className="mb-6 inline-block text-sm font-medium text-slate-700">
        ← Back to products
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div className={`h-[420px] rounded-[2rem] bg-gradient-to-br ${product.accent}`} />
        <div className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              {product.category}
            </p>
            <h1 className="mt-3 text-4xl font-black text-slate-900">{product.name}</h1>
          </div>

          <p className="text-3xl font-bold text-slate-900">
            {selected ? formatCents(selected.priceCents) : "—"}
          </p>
          <p className="text-lg text-slate-600">{product.description}</p>

          {product.optionName && sellable.length > 1 ? (
            <fieldset>
              <legend className="text-sm font-semibold text-slate-800">{product.optionName}</legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {sellable.map((variant) => {
                  const soldOut = variant.availableQty < 1;

                  return (
                    <button
                      key={variant.sku}
                      type="button"
                      disabled={soldOut}
                      aria-pressed={variant.sku === selectedSku}
                      onClick={() => setSelectedSku(variant.sku)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium ${
                        variant.sku === selectedSku
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-300 bg-white text-slate-800"
                      } ${soldOut ? "cursor-not-allowed line-through opacity-50" : ""}`}
                    >
                      {variant.optionValue ?? variant.sku}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          ) : null}

          <p className="text-sm text-slate-600">
            {selected ? (
              <>
                SKU <span className="font-mono">{selected.sku}</span> ·{" "}
                {selected.availableQty > 0 ? `${selected.availableQty} in stock` : "Out of stock"}
              </>
            ) : (
              "Unavailable"
            )}
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => selected && addToCart(selected)}
              disabled={outOfStock}
              className="rounded-full bg-slate-900 px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
            >
              {outOfStock ? "Sold out" : "Add to cart"}
            </button>
            <Link
              href="/cart"
              className="rounded-full border border-slate-300 px-6 py-3 font-medium text-slate-800"
            >
              View cart
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-600">
              Includes
            </p>
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
