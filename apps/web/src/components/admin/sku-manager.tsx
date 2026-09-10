"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminSkuView, ProductView, SkuUpsertRequest } from "@commerceops/types";
import {
  archiveAdminSku,
  createAdminSku,
  fetchAdminSkus,
  updateAdminSku,
} from "../../lib/admin-skus-api";
import { fetchAdminProducts } from "../../lib/admin-products-api";
import { formatCents } from "../../lib/money";
import { queryKeys } from "../../lib/query-keys";

type Draft = {
  sku: string;
  productId: string;
  optionValue: string;
  price: string;
  imageUrl: string;
  images: { url: string; isPrimary: boolean }[];
};

const emptyDraft: Draft = {
  sku: "",
  productId: "",
  optionValue: "",
  price: "",
  imageUrl: "",
  images: [{ url: "", isPrimary: false }],
};

function toDraft(sku: AdminSkuView): Draft {
  return {
    sku: sku.sku,
    productId: sku.productId,
    optionValue: sku.optionValue ?? "",
    price: (sku.priceCents / 100).toFixed(2),
    imageUrl: sku.imageUrl ?? "",
    images: sku.images.length
      ? sku.images.map((image) => ({ url: image.url, isPrimary: image.isPrimary }))
      : [{ url: "", isPrimary: false }],
  };
}

function SkuEditForm({
  draft,
  products,
  submitting,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: Draft;
  products: ProductView[];
  submitting: boolean;
  onChange: (draft: Draft) => void;
  onCancel: () => void;
  onSubmit: (payload: SkuUpsertRequest) => void;
}) {
  function submit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit({
      sku: draft.sku.trim().toUpperCase(),
      productId: draft.productId,
      optionValue: draft.optionValue.trim() || null,
      priceCents: Math.round(Number(draft.price) * 100),
      imageUrl:
        draft.images.find((image) => image.isPrimary)?.url.trim() ||
        draft.images[0]?.url.trim() ||
        null,
      images: draft.images
        .map((image, position) => ({ url: image.url.trim(), position, isPrimary: image.isPrimary }))
        .filter((image) => image.url.length > 0),
      isActive: true,
    });
  }

  return (
    <form
      onSubmit={submit}
      className="grid gap-3 bg-slate-50 p-4 md:grid-cols-[1.2fr_1.5fr_1fr_0.8fr_auto]"
    >
      <label className="text-sm font-medium text-slate-700">
        SKU
        <input
          required
          pattern="[A-Z0-9][A-Z0-9-]*"
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2 font-mono uppercase"
          value={draft.sku}
          onChange={(event) => onChange({ ...draft, sku: event.target.value })}
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Product
        <select
          required
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
          value={draft.productId}
          onChange={(event) => onChange({ ...draft, productId: event.target.value })}
        >
          <option value="">Select product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} (/{product.slug})
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-medium text-slate-700">
        Option value
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
          value={draft.optionValue}
          onChange={(event) => onChange({ ...draft, optionValue: event.target.value })}
        />
      </label>
      <label className="text-sm font-medium text-slate-700">
        Price
        <input
          required
          min="0"
          step="0.01"
          type="number"
          className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-2"
          value={draft.price}
          onChange={(event) => onChange({ ...draft, price: event.target.value })}
        />
      </label>
      <div className="text-sm font-medium text-slate-700 md:col-span-2">
        <p>SKU images</p>
        <div className="mt-1 space-y-2">
          {draft.images.map((image, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                className="min-w-0 flex-1 rounded-lg border border-slate-300 px-2 py-2"
                placeholder="https://..."
                type="url"
                value={image.url}
                onChange={(event) =>
                  onChange({
                    ...draft,
                    images: draft.images.map((current, i) =>
                      i === index ? { ...current, url: event.target.value } : current,
                    ),
                  })
                }
              />
              <label className="flex shrink-0 items-center gap-1 text-xs font-normal">
                <input
                  type="checkbox"
                  checked={image.isPrimary}
                  onChange={() =>
                    onChange({
                      ...draft,
                      images: draft.images.map((current, i) => ({
                        ...current,
                        isPrimary: i === index ? !image.isPrimary : false,
                      })),
                    })
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
          onClick={() =>
            onChange({ ...draft, images: [...draft.images, { url: "", isPrimary: false }] })
          }
        >
          Add image
        </button>
      </div>
      <div className="flex items-end gap-2">
        <button
          disabled={submitting}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-slate-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function SkuManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [error, setError] = useState<string | null>(null);

  const skusQuery = useQuery({
    queryKey: [...queryKeys.adminSkus, search, page],
    queryFn: () => fetchAdminSkus(search, page),
  });
  const productsQuery = useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: () => fetchAdminProducts("", 1, 100),
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminSkus }),
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: SkuUpsertRequest) =>
      creating ? createAdminSku(payload) : updateAdminSku(editingId as string, payload),
    onSuccess: async () => {
      setCreating(false);
      setEditingId(null);
      setDraft(emptyDraft);
      setError(null);
      await refresh();
    },
    onError: (value) => setError(value instanceof Error ? value.message : "Unable to save SKU"),
  });

  const disableMutation = useMutation({
    mutationFn: (sku: AdminSkuView) =>
      updateAdminSku(sku.id, {
        sku: sku.sku,
        productId: sku.productId,
        optionValue: sku.optionValue,
        priceCents: sku.priceCents,
        imageUrl: sku.imageUrl,
        images: sku.images,
        isActive: false,
      }),
    onSuccess: refresh,
    onError: (value) => setError(value instanceof Error ? value.message : "Unable to disable SKU"),
  });

  const archiveMutation = useMutation({
    mutationFn: archiveAdminSku,
    onSuccess: refresh,
    onError: (value) => setError(value instanceof Error ? value.message : "Unable to archive SKU"),
  });

  function confirmArchive(sku: AdminSkuView) {
    if (
      window.confirm(
        "Archiving a SKU cannot be undone. It will be removed from all product links and cannot be used for new orders. Continue?",
      )
    ) {
      archiveMutation.mutate(sku.id);
    }
  }

  function confirmDisable(sku: AdminSkuView) {
    if (
      window.confirm(
        "This SKU will no longer be available for this product. Existing orders and inventory will be preserved. Continue?",
      )
    ) {
      disableMutation.mutate(sku);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">SKUs</h1>
          <p className="mt-1 text-sm text-slate-600">
            Create SKUs separately and link them to multiple products.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditingId(null);
            setDraft(emptyDraft);
            setError(null);
          }}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          New SKU link
        </button>
      </div>

      <label className="mt-6 block max-w-sm text-sm font-medium text-slate-700">
        Search
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="SKU or product"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </label>

      {creating ? (
        <div className="mt-6 rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="mb-3 text-sm font-semibold text-sky-900">Create or link a SKU</p>
          <SkuEditForm
            draft={draft}
            products={productsQuery.data?.products ?? []}
            submitting={saveMutation.isPending}
            onChange={setDraft}
            onCancel={() => setCreating(false)}
            onSubmit={(payload) => saveMutation.mutate(payload)}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {skusQuery.isLoading ? (
        <p className="mt-6 text-slate-600">Loading SKUs…</p>
      ) : skusQuery.isError ? (
        <p className="mt-6 text-red-700">Unable to load SKUs.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="p-3">SKU</th>
                <th className="p-3">Product</th>
                <th className="p-3">Option</th>
                <th className="p-3">Price</th>
                <th className="p-3">Stock</th>
                <th className="p-3">State</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {skusQuery.data?.skus.map((sku) => (
                <tr key={sku.id} className="border-t border-slate-100">
                  <td colSpan={7} className="p-0">
                    <div className="grid grid-cols-[1fr_1fr_1fr_0.8fr_0.6fr_0.7fr_1.3fr] items-center">
                      <span className="p-3 font-mono text-xs">{sku.sku}</span>
                      <span className="p-3">{sku.productName}</span>
                      <span className="p-3">{sku.optionValue ?? "—"}</span>
                      <span className="p-3">{formatCents(sku.priceCents)}</span>
                      <span className="p-3">{sku.availableQty}</span>
                      <span className="p-3">
                        {sku.isArchived ? "archived" : sku.isActive ? "active" : "disabled"}
                      </span>
                      <span className="p-3 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            setCreating(false);
                            setEditingId(sku.id);
                            setDraft(toDraft(sku));
                            setError(null);
                          }}
                          className="mr-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          Edit
                        </button>
                        {!sku.isArchived && sku.isActive ? (
                          <button
                            type="button"
                            onClick={() => confirmDisable(sku)}
                            className="mr-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
                          >
                            Disable
                          </button>
                        ) : null}
                        {!sku.isArchived && !sku.isActive ? (
                          <button
                            type="button"
                            onClick={() =>
                              updateAdminSku(sku.id, {
                                sku: sku.sku,
                                productId: sku.productId,
                                optionValue: sku.optionValue,
                                priceCents: sku.priceCents,
                                imageUrl: sku.imageUrl,
                                images: sku.images,
                                isActive: true,
                              })
                                .then(refresh)
                                .catch((value) =>
                                  setError(
                                    value instanceof Error ? value.message : "Unable to enable SKU",
                                  ),
                                )
                            }
                            className="mr-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100"
                          >
                            Enable
                          </button>
                        ) : null}
                        {!sku.isArchived ? (
                          <button
                            type="button"
                            onClick={() => confirmArchive(sku)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 hover:bg-red-100"
                          >
                            Archive
                          </button>
                        ) : null}
                      </span>
                    </div>
                    {editingId === sku.id ? (
                      <SkuEditForm
                        draft={draft}
                        products={productsQuery.data?.products ?? []}
                        submitting={saveMutation.isPending}
                        onChange={setDraft}
                        onCancel={() => setEditingId(null)}
                        onSubmit={(payload) => saveMutation.mutate(payload)}
                      />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {!skusQuery.isLoading && !skusQuery.isError && skusQuery.data ? (
        <div className="mt-6 flex items-center justify-between text-sm">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-slate-600">Page {page}</span>
          <button
            type="button"
            disabled={!skusQuery.data.hasMore}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
