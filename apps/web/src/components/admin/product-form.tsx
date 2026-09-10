"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { ProductStatus, ProductUpsertRequest, ProductView } from "@commerceops/types";
import { fetchInventoryContext } from "../../lib/inventory-api";
import { fetchNextSku } from "../../lib/admin-skus-api";

const STATUSES: ProductStatus[] = ["draft", "active", "archived"];

type VariantDraft = {
  id?: string;
  sku: string;
  optionValue: string;
  price: string;
  isActive: boolean;
  stockInput: string;
};

export type ProductStockUpdate = {
  sku: string;
  deltaQty: number;
  inventoryLevelId?: string;
  expectedVersion?: number;
};

type ImageDraft = { url: string; isPrimary: boolean };

function toDraft(product: ProductView | null): {
  slug: string;
  name: string;
  description: string;
  shortDescription: string;
  tag: string;
  category: string;
  accent: string;
  imageUrl: string;
  images: ImageDraft[];
  features: string;
  status: ProductStatus;
  optionName: string;
  variants: VariantDraft[];
} {
  if (!product) {
    return {
      slug: "",
      name: "",
      description: "",
      shortDescription: "",
      tag: "",
      category: "",
      accent: "from-sky-500 to-cyan-500",
      imageUrl: "",
      images: [{ url: "", isPrimary: false }],
      features: "",
      status: "draft",
      optionName: "",
      variants: [],
    };
  }

  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    shortDescription: product.shortDescription,
    tag: product.tag,
    category: product.category,
    accent: product.accent,
    imageUrl: product.imageUrl ?? "",
    images: product.images.length
      ? product.images.map((image) => ({ url: image.url, isPrimary: image.isPrimary }))
      : [{ url: "", isPrimary: false }],
    features: product.features.join("\n"),
    status: product.status,
    optionName: product.optionName ?? "",
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      optionValue: variant.optionValue ?? "",
      price: (variant.priceCents / 100).toFixed(2),
      isActive: variant.isActive,
      stockInput: "",
    })),
  };
}

export function ProductForm({
  product,
  onSubmit,
  onCancel,
  submitting,
  error,
}: {
  product: ProductView | null;
  onSubmit: (payload: ProductUpsertRequest, stockUpdates: ProductStockUpdate[]) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [draft, setDraft] = useState(() => toDraft(product));
  const [localError, setLocalError] = useState<string | null>(null);
  const nextSkuQuery = useQuery({
    queryKey: ["admin", "next-sku"],
    queryFn: fetchNextSku,
  });
  const inventoryQuery = useQuery({
    queryKey: [
      "inventory",
      "product-form",
      product?.id,
      draft.variants.map((variant) => variant.sku),
    ],
    queryFn: async () => {
      const levels = await Promise.all(
        draft.variants
          .filter((variant) => variant.sku.trim())
          .map((variant) => fetchInventoryContext("", "", variant.sku.trim())),
      );
      return new Map(
        levels.flatMap((context) => context.levels.map((level) => [level.sku, level])),
      );
    },
    enabled: Boolean(product && draft.variants.some((variant) => variant.sku.trim())),
    refetchOnMount: "always",
  });

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLocalError(null);

    const variants = draft.variants.map((variant) => {
      const price = Number(variant.price);

      return {
        id: variant.id,
        sku: variant.sku.trim().toUpperCase(),
        optionValue: variant.optionValue.trim() || null,
        // Parsed to cents here so the API never receives a float.
        priceCents: Math.round(price * 100),
        isActive: variant.isActive,
      };
    });
    const stockUpdates: ProductStockUpdate[] = [];

    for (const variant of draft.variants) {
      const stockInput = variant.stockInput.trim();
      if (!stockInput) continue;

      const deltaQty = Number.parseInt(stockInput, 10);
      if (!Number.isInteger(deltaQty) || deltaQty === 0) {
        setLocalError(`Stock for ${variant.sku || "the variant"} must be a non-zero integer.`);
        return;
      }

      if (!product && deltaQty < 0) {
        setLocalError(`Initial stock for ${variant.sku || "the variant"} cannot be negative.`);
        return;
      }

      const level = inventoryQuery.data?.get(variant.sku.trim());
      if (level && level.availableQty + deltaQty < 0) {
        setLocalError(`Stock for ${variant.sku} cannot become negative.`);
        return;
      }

      stockUpdates.push({
        sku: variant.sku.trim().toUpperCase(),
        deltaQty,
        inventoryLevelId: level?.id,
        expectedVersion: level?.expectedVersion,
      });
    }

    if (variants.length === 0) {
      setLocalError("Add at least one SKU before saving the product.");
      return;
    }

    if (
      variants.some((variant) => !Number.isFinite(variant.priceCents) || variant.priceCents < 0)
    ) {
      setLocalError("Every variant needs a valid price.");
      return;
    }

    if (variants.some((variant) => variant.sku.length < 2)) {
      setLocalError("Every variant needs a SKU.");
      return;
    }

    onSubmit(
      {
        slug: draft.slug.trim(),
        name: draft.name.trim(),
        description: draft.description.trim(),
        shortDescription: draft.shortDescription.trim(),
        tag: draft.tag.trim() || "New",
        category: draft.category.trim() || "General",
        accent: draft.accent.trim() || "from-sky-500 to-cyan-500",
        imageUrl:
          draft.images.find((image) => image.isPrimary)?.url.trim() ||
          draft.images[0]?.url.trim() ||
          null,
        images: draft.images
          .map((image, position) => ({
            url: image.url.trim(),
            position,
            isPrimary: image.isPrimary,
          }))
          .filter((image) => image.url.length > 0),
        features: draft.features
          .split(/[\n|]/)
          .map((line) => line.trim())
          .filter(Boolean),
        status: draft.status,
        optionName: draft.optionName.trim() || null,
        variants,
      },
      stockUpdates,
    );
  }

  const message = localError ?? error;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-xl font-bold">{product ? "Edit product" : "New product"}</h2>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Name
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            required
            value={draft.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Slug
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            required
            placeholder="lowercase-with-hyphens"
            value={draft.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Description
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          rows={3}
          value={draft.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Short description
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          maxLength={240}
          placeholder="A concise description shown in product listings"
          rows={2}
          value={draft.shortDescription}
          onChange={(e) => set("shortDescription", e.target.value)}
        />
        <span className="mt-1 block text-xs font-normal text-slate-500">
          {draft.shortDescription.length}/240 characters
        </span>
      </label>

      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label className="text-sm font-medium text-slate-700">
          Tag
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={draft.tag}
            onChange={(e) => set("tag", e.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Category
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={draft.category}
            onChange={(e) => set("category", e.target.value)}
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          Status
          <select
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            value={draft.status}
            onChange={(e) => set("status", e.target.value as ProductStatus)}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          Accent gradient
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-sm"
            value={draft.accent}
            onChange={(e) => set("accent", e.target.value)}
          />
        </label>
        <div className="text-sm font-medium text-slate-700 md:order-3 md:col-span-2">
          <p>Product images</p>
          <div className="mt-1 space-y-2">
            {draft.images.map((image, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="https://..."
                  type="url"
                  value={image.url}
                  onChange={(event) =>
                    set(
                      "images",
                      draft.images.map((current, i) =>
                        i === index ? { ...current, url: event.target.value } : current,
                      ),
                    )
                  }
                />
                <label className="flex shrink-0 items-center gap-1 text-xs font-normal">
                  <input
                    type="checkbox"
                    checked={image.isPrimary}
                    onChange={() =>
                      set(
                        "images",
                        draft.images.map((current, i) => ({
                          ...current,
                          isPrimary: i === index ? !image.isPrimary : false,
                        })),
                      )
                    }
                  />
                  Cover
                </label>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="mt-2 rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold"
            onClick={() => set("images", [...draft.images, { url: "", isPrimary: false }])}
          >
            Add image
          </button>
        </div>
        <label className="text-sm font-medium text-slate-700 md:order-2">
          Option name
          <input
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Size, Colour… (leave blank for one variant)"
            value={draft.optionName}
            onChange={(e) => set("optionName", e.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Features, one per line (or separated by |)
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          rows={3}
          value={draft.features}
          onChange={(e) => set("features", e.target.value)}
        />
      </label>

      <section className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-slate-900">Variants and SKUs</h3>
            <p className="mt-1 text-sm text-slate-600">
              Add each SKU that belongs to this product.
            </p>
          </div>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700"
            onClick={async () => {
              const nextSku = (await nextSkuQuery.refetch()).data ?? "SKU-000001";
              const used = new Set(draft.variants.map((variant) => variant.sku));
              const match = /^SKU-(\d{6})$/.exec(nextSku);
              let number = match ? Number(match[1]) : 1;
              let generated = `SKU-${String(number).padStart(6, "0")}`;
              while (used.has(generated)) {
                number += 1;
                generated = `SKU-${String(number).padStart(6, "0")}`;
              }
              set("variants", [
                ...draft.variants,
                { sku: generated, optionValue: "", price: "", isActive: true, stockInput: "" },
              ]);
            }}
          >
            Add SKU
          </button>
        </div>

        {draft.variants.length === 0 ? (
          <p className="mt-4 rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
            No SKUs added yet. Add at least one SKU before saving this product.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {draft.variants.map((variant, index) => (
              <div
                key={variant.id ?? index}
                className="rounded-lg border border-slate-200 bg-white p-3"
              >
                <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_0.8fr_0.9fr_auto]">
                  <label className="text-sm font-medium text-slate-700">
                    SKU
                    <input
                      required
                      pattern="[A-Za-z0-9][A-Za-z0-9-]*"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 font-mono uppercase"
                      placeholder="PRODUCT-001"
                      value={variant.sku}
                      onChange={(event) =>
                        set(
                          "variants",
                          draft.variants.map((current, currentIndex) =>
                            currentIndex === index
                              ? { ...current, sku: event.target.value }
                              : current,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    {draft.optionName || "Option value"}
                    <input
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="Standard"
                      value={variant.optionValue}
                      onChange={(event) =>
                        set(
                          "variants",
                          draft.variants.map((current, currentIndex) =>
                            currentIndex === index
                              ? { ...current, optionValue: event.target.value }
                              : current,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    Price
                    <input
                      required
                      min="0"
                      step="0.01"
                      type="number"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      placeholder="0.00"
                      value={variant.price}
                      onChange={(event) =>
                        set(
                          "variants",
                          draft.variants.map((current, currentIndex) =>
                            currentIndex === index
                              ? { ...current, price: event.target.value }
                              : current,
                          ),
                        )
                      }
                    />
                  </label>
                  <label className="text-sm font-medium text-slate-700">
                    {product
                      ? `Available (${inventoryQuery.data?.get(variant.sku)?.locationId ?? "warehouse-main"})`
                      : "Initial stock"}
                    <input
                      min={product ? undefined : "0"}
                      step="1"
                      type="number"
                      className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      placeholder={product ? "+10 or -3" : "0"}
                      value={variant.stockInput}
                      onChange={(event) =>
                        set(
                          "variants",
                          draft.variants.map((current, currentIndex) =>
                            currentIndex === index
                              ? { ...current, stockInput: event.target.value }
                              : current,
                          ),
                        )
                      }
                    />
                    {product ? (
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        Current:{" "}
                        {inventoryQuery.data?.get(variant.sku)?.availableQty ?? "Loading..."}
                      </span>
                    ) : null}
                  </label>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 pb-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        checked={variant.isActive}
                        onChange={(event) =>
                          set(
                            "variants",
                            draft.variants.map((current, currentIndex) =>
                              currentIndex === index
                                ? { ...current, isActive: event.target.checked }
                                : current,
                            ),
                          )
                        }
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      className="mb-1 rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700"
                      onClick={() =>
                        set(
                          "variants",
                          draft.variants.filter((_, currentIndex) => currentIndex !== index),
                        )
                      }
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="mt-6 rounded-xl border border-sky-100 bg-sky-50 p-4 text-sm text-sky-800">
        Product variants are saved here. Edit SKU records, prices, and SKU media from the{" "}
        <Link href="/inventory" className="font-semibold underline">
          Inventory workspace
        </Link>
        .
      </p>

      {message ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {submitting ? "Saving…" : "Save product"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
