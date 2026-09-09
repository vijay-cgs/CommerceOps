"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { ProductView } from "@commerceops/types";
import { formatCents } from "../../lib/money";
import { useCart } from "./cart-provider";

export function ProductDetailView({ product }: { product: ProductView }) {
  const { addToCart } = useCart();
  const sellable = product.variants.filter((variant) => variant.isActive);

  const [selectedSku, setSelectedSku] = useState(
    () => sellable.find((variant) => variant.availableQty > 0)?.sku ?? sellable[0]?.sku ?? "",
  );
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const thumbnailTrackRef = useRef<HTMLDivElement>(null);

  const selected = sellable.find((variant) => variant.sku === selectedSku);
  const outOfStock = !selected || selected.availableQty < 1;
  const gallery = selected?.images.length ? selected.images : product.images;
  const coverImage = gallery.find((image) => image.isPrimary);
  const detailGallery = coverImage
    ? gallery.filter((image) => image.id !== coverImage.id)
    : gallery;
  const selectedImage =
    detailGallery.find((image) => image.id === selectedImageId) ?? detailGallery[0];

  function slideThumbnails(direction: "left" | "right") {
    thumbnailTrackRef.current?.scrollBy({
      left: direction === "left" ? -220 : 220,
      behavior: "smooth",
    });
  }

  useEffect(() => {
    setSelectedImageId(null);
  }, [selectedSku]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <Link href="/products" className="mb-6 inline-block text-sm font-medium text-slate-700">
        ← Back to products
      </Link>
      <div className="grid gap-10 md:grid-cols-2">
        <div>
          <div className={`h-[420px] rounded-[2rem] bg-gradient-to-br ${product.accent}`}>
            {selectedImage?.url ? (
              <img
                src={selectedImage.url}
                alt={selectedImage?.altText ?? selected?.sku ?? product.name}
                className="h-full w-full rounded-[2rem] object-cover"
              />
            ) : null}
          </div>
          {detailGallery.length > 1 ? (
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                aria-label="Previous product images"
                onClick={() => slideThumbnails("left")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 hover:bg-slate-50"
              >
                ‹
              </button>
              <div ref={thumbnailTrackRef} className="flex min-w-0 gap-2 overflow-hidden">
                {detailGallery.map((image) => (
                  <button
                    key={image.id}
                    type="button"
                    aria-label={`View ${image.altText ?? product.name} image`}
                    aria-pressed={selectedImage?.id === image.id}
                    onClick={() => setSelectedImageId(image.id)}
                    className={`shrink-0 rounded-lg border-2 p-0.5 ${selectedImage?.id === image.id ? "border-slate-900" : "border-transparent"}`}
                  >
                    <img
                      src={image.url}
                      alt={image.altText ?? product.name}
                      className="h-16 w-16 rounded-md object-cover"
                    />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-label="Next product images"
                onClick={() => slideThumbnails("right")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-lg text-slate-700 hover:bg-slate-50"
              >
                ›
              </button>
            </div>
          ) : null}
        </div>
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
