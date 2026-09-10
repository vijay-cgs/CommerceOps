"use client";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProductForm } from "../../../../components/admin/product-form";
import { AdminTabs } from "../../../../components/admin/admin-tabs";
import { fetchAdminProduct, updateAdminProduct } from "../../../../lib/admin-products-api";
import { queryKeys } from "../../../../lib/query-keys";
import type { ProductUpsertRequest } from "@commerceops/types";
import type { ProductStockUpdate } from "../../../../components/admin/product-form";
import { fetchInventoryContext, submitInventoryAdjustment } from "../../../../lib/inventory-api";

export default function AdminProductEditPage() {
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
      router.push("/admin/products");
    },
  });

  if (productQuery.isLoading) {
    return <p className="text-slate-600">Loading product...</p>;
  }

  if (productQuery.isError || !productQuery.data) {
    return <p className="text-red-700">Unable to load this product.</p>;
  }

  return (
    <section>
      <AdminTabs />
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Products / Product update</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">{productQuery.data.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
        >
          Back to products
        </button>
      </div>
      <ProductForm
        product={productQuery.data}
        submitting={saveMutation.isPending}
        error={saveMutation.error instanceof Error ? saveMutation.error.message : null}
        onCancel={() => router.push("/admin/products")}
        onSubmit={(payload, stockUpdates) => saveMutation.mutate({ payload, stockUpdates })}
      />
    </section>
  );
}
