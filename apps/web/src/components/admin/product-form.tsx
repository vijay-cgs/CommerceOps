"use client";

import { useState } from "react";
import type { ProductStatus, ProductUpsertRequest, ProductView } from "@commerceops/types";

const STATUSES: ProductStatus[] = ["draft", "active", "archived"];

type VariantDraft = {
  id?: string;
  sku: string;
  optionValue: string;
  price: string;
  isActive: boolean;
};

function toDraft(product: ProductView | null): {
  slug: string;
  name: string;
  description: string;
  tag: string;
  category: string;
  accent: string;
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
      tag: "",
      category: "",
      accent: "from-sky-500 to-cyan-500",
      features: "",
      status: "draft",
      optionName: "",
      variants: [{ sku: "", optionValue: "", price: "", isActive: true }],
    };
  }

  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    tag: product.tag,
    category: product.category,
    accent: product.accent,
    features: product.features.join("\n"),
    status: product.status,
    optionName: product.optionName ?? "",
    variants: product.variants.map((variant) => ({
      id: variant.id,
      sku: variant.sku,
      optionValue: variant.optionValue ?? "",
      price: (variant.priceCents / 100).toFixed(2),
      isActive: variant.isActive,
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
  onSubmit: (payload: ProductUpsertRequest) => void;
  onCancel: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [draft, setDraft] = useState(() => toDraft(product));
  const [localError, setLocalError] = useState<string | null>(null);

  function set<K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  function setVariant(index: number, patch: Partial<VariantDraft>) {
    setDraft((current) => ({
      ...current,
      variants: current.variants.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant,
      ),
    }));
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

    onSubmit({
      slug: draft.slug.trim(),
      name: draft.name.trim(),
      description: draft.description.trim(),
      tag: draft.tag.trim(),
      category: draft.category.trim(),
      accent: draft.accent.trim(),
      features: draft.features
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      status: draft.status,
      optionName: draft.optionName.trim() || null,
      variants,
    });
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
        <label className="text-sm font-medium text-slate-700">
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
        Features, one per line
        <textarea
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          rows={3}
          value={draft.features}
          onChange={(e) => set("features", e.target.value)}
        />
      </label>

      <fieldset className="mt-6">
        <legend className="text-sm font-semibold text-slate-800">Variants</legend>

        <div className="mt-3 space-y-3">
          {draft.variants.map((variant, index) => (
            <div
              key={variant.id ?? `new-${index}`}
              className="grid items-end gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-[1.2fr_1fr_0.8fr_auto_auto]"
            >
              <label className="text-xs font-medium text-slate-600">
                SKU
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 font-mono text-sm uppercase"
                  required
                  value={variant.sku}
                  onChange={(e) => setVariant(index, { sku: e.target.value })}
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                {draft.optionName || "Option"}
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  value={variant.optionValue}
                  onChange={(e) => setVariant(index, { optionValue: e.target.value })}
                />
              </label>
              <label className="text-xs font-medium text-slate-600">
                Price
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
                  required
                  inputMode="decimal"
                  step="0.01"
                  min="0"
                  type="number"
                  value={variant.price}
                  onChange={(e) => setVariant(index, { price: e.target.value })}
                />
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={variant.isActive}
                  onChange={(e) => setVariant(index, { isActive: e.target.checked })}
                />
                Active
              </label>
              <button
                type="button"
                className="text-sm font-medium text-red-600 disabled:opacity-40"
                disabled={draft.variants.length === 1}
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    variants: current.variants.filter((_, i) => i !== index),
                  }))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-3 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium"
          onClick={() =>
            setDraft((current) => ({
              ...current,
              variants: [
                ...current.variants,
                { sku: "", optionValue: "", price: "", isActive: true },
              ],
            }))
          }
        >
          Add variant
        </button>
      </fieldset>

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
