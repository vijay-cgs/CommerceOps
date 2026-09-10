"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductUpsertRequest, ProductView } from "@commerceops/types";
import {
  archiveAdminProduct,
  createAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
} from "../../lib/admin-products-api";
import { formatCents } from "../../lib/money";
import { queryKeys } from "../../lib/query-keys";
import { ProductForm } from "./product-form";

const STATUS_STYLES: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800",
  draft: "bg-amber-100 text-amber-800",
  archived: "bg-slate-200 text-slate-600",
};

export function ProductManager() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<ProductView | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const productsQuery = useQuery({
    queryKey: [...queryKeys.adminProducts, search, page],
    queryFn: () => fetchAdminProducts(search, page),
  });

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts }),
      queryClient.invalidateQueries({ queryKey: queryKeys.products }),
    ]);
  }

  const saveMutation = useMutation({
    mutationFn: (payload: ProductUpsertRequest) =>
      editing ? updateAdminProduct(editing.id, payload) : createAdminProduct(payload),
    onSuccess: async () => {
      setEditing(null);
      setCreating(false);
      setError(null);
      await refresh();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to save");
    },
  });

  const archiveMutation = useMutation({
    mutationFn: archiveAdminProduct,
    onSuccess: refresh,
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Unable to archive");
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ product, status }: { product: ProductView; status: "active" | "draft" }) =>
      updateAdminProduct(product.id, {
        slug: product.slug,
        name: product.name,
        description: product.description,
        tag: product.tag,
        category: product.category,
        accent: product.accent,
        imageUrl: product.imageUrl,
        images: product.images,
        features: product.features,
        status,
        optionName: product.optionName,
        variants: product.variants.map((v) => ({
          id: v.id,
          sku: v.sku,
          optionValue: v.optionValue,
          priceCents: v.priceCents,
          isActive: v.isActive,
        })),
      }),
    onSuccess: refresh,
    onError: (mutationError) => {
      setError(
        mutationError instanceof Error ? mutationError.message : "Unable to update product status",
      );
    },
  });

  if (creating || editing) {
    return (
      <ProductForm
        product={editing}
        submitting={saveMutation.isPending}
        error={error}
        onCancel={() => {
          setCreating(false);
          setEditing(null);
          setError(null);
        }}
        onSubmit={(payload) => saveMutation.mutate(payload)}
      />
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage catalog entries. SKUs are managed separately.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setError(null);
          }}
          className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white"
        >
          New product
        </button>
      </div>

      <label className="mt-6 block max-w-sm text-sm font-medium text-slate-700">
        Search
        <input
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          placeholder="Name, slug or SKU"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
        />
      </label>

      {error ? (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {productsQuery.isLoading ? (
        <p className="mt-6 text-slate-600">Loading products…</p>
      ) : productsQuery.isError ? (
        <p className="mt-6 text-red-700">Unable to load products.</p>
      ) : productsQuery.data?.products.length === 0 ? (
        <p className="mt-6 text-slate-600">No products match that search.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {productsQuery.data?.products.map((product) => (
            <article key={product.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold">{product.name}</h2>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_STYLES[product.status] ?? ""
                      }`}
                    >
                      {product.status}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-500">/{product.slug}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(product);
                      setError(null);
                    }}
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit
                  </button>
                  {product.status === "active" ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "This product will no longer be available in the storefront. Existing orders and linked SKUs will be preserved. Continue?",
                          )
                        ) {
                          statusMutation.mutate({ product, status: "draft" });
                        }
                      }}
                      disabled={statusMutation.isPending}
                      className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                    >
                      Disable
                    </button>
                  ) : product.status === "draft" ? (
                    <button
                      type="button"
                      onClick={() => statusMutation.mutate({ product, status: "active" })}
                      disabled={statusMutation.isPending}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      Enable
                    </button>
                  ) : null}
                  {product.status !== "archived" ? (
                    <button
                      type="button"
                      onClick={() => archiveMutation.mutate(product.id)}
                      disabled={archiveMutation.isPending}
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-800 disabled:opacity-50"
                    >
                      Archive
                    </button>
                  ) : null}
                </div>
              </div>

              <table className="mt-4 w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="py-1">SKU</th>
                    <th className="py-1">{product.optionName ?? "Variant"}</th>
                    <th className="py-1">Price</th>
                    <th className="py-1">In stock</th>
                    <th className="py-1">State</th>
                  </tr>
                </thead>
                <tbody>
                  {product.variants.map((variant) => (
                    <tr key={variant.sku} className="border-t border-slate-100">
                      <td className="py-1.5 font-mono text-xs">{variant.sku}</td>
                      <td className="py-1.5">{variant.optionValue ?? "—"}</td>
                      <td className="py-1.5">{formatCents(variant.priceCents)}</td>
                      <td
                        className={`py-1.5 ${
                          variant.availableQty < 1
                            ? "font-semibold text-red-700"
                            : variant.availableQty < 10
                              ? "font-semibold text-amber-700"
                              : ""
                        }`}
                      >
                        {variant.availableQty}
                      </td>
                      <td className="py-1.5 text-slate-600">
                        {variant.isActive ? "active" : "inactive"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          ))}
        </div>
      )}
      {!productsQuery.isLoading && !productsQuery.isError && productsQuery.data ? (
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
            disabled={!productsQuery.data.hasMore}
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
