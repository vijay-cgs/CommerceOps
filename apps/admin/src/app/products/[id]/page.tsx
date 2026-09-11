"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProductUpsertRequest } from "@commerceops/types";
import { ProductForm } from "../../../../../web/src/components/admin/product-form";
import type { ProductStockUpdate } from "../../../../../web/src/components/admin/product-form";
import { AdminTabs } from "../../../components/admin-tabs";
import {
  fetchAdminProduct,
  updateAdminProduct,
} from "../../../../../web/src/lib/admin-products-api";
import {
  fetchInventoryContext,
  submitInventoryAdjustment,
} from "../../../../../web/src/lib/inventory-api";
import { queryKeys } from "../../../../../web/src/lib/query-keys";

export default function AdminProductZonePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const productQuery = useQuery({
    queryKey: ["admin", "product", params.id],
    queryFn: () => fetchAdminProduct(params.id),
    enabled: Boolean(params.id),
  });
  const saveMutation = useMutation({
    mutationFn: async ({
      payload,
      stockUpdates,
    }: {
      payload: ProductUpsertRequest;
      stockUpdates: ProductStockUpdate[];
    }) => {
      const savedProduct = await updateAdminProduct(params.id, payload);

      for (const update of stockUpdates) {
        const level = update.inventoryLevelId
          ? { id: update.inventoryLevelId, expectedVersion: update.expectedVersion ?? 1 }
          : (await fetchInventoryContext("", "", update.sku)).levels[0];
        if (!level) continue;

        await submitInventoryAdjustment({
          inventoryLevelId: level.id,
          reasonCode: "stock_count_correction",
          deltaQty: update.deltaQty,
          expectedVersion: level.expectedVersion,
          idempotencyKey: crypto.randomUUID(),
        });
      }

      return savedProduct;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts });
      await queryClient.invalidateQueries({ queryKey: queryKeys.products });
      router.push("/products");
    },
  });

  if (productQuery.isLoading) {
    return <p className="mx-auto max-w-6xl px-6 py-8 text-slate-600">Loading product...</p>;
  }

  if (productQuery.isError || !productQuery.data) {
    return <p className="mx-auto max-w-6xl px-6 py-8 text-red-700">Unable to load this product.</p>;
  }

  return (
    <section className="mx-auto max-w-6xl px-6 py-8">
      <AdminTabs />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Products / Product update</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{productQuery.data.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/products")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Back to products
        </button>
      </div>
      <ProductForm
        product={productQuery.data}
        submitting={saveMutation.isPending}
        error={saveMutation.error instanceof Error ? saveMutation.error.message : null}
        onCancel={() => router.push("/products")}
        onSubmit={(payload, stockUpdates) => saveMutation.mutate({ payload, stockUpdates })}
      />
    </section>
  );
}
