"use client";

import { notFound, useParams } from "next/navigation";
import { ProductDetailView } from "../../../components/storefront/product-detail-view";
import { useQuery } from "@tanstack/react-query";
import { fetchProduct, StorefrontApiError } from "../../../lib/catalog-api";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const {
    data: product,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["catalog", "product", params?.slug],
    queryFn: () => fetchProduct(params.slug),
    enabled: Boolean(params?.slug),
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <p className="mx-auto max-w-6xl text-slate-600">Loading product…</p>
      </main>
    );
  }

  if (isError) {
    if (error instanceof StorefrontApiError && error.code === "product_not_found") {
      notFound();
    }

    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <p className="mx-auto max-w-6xl text-red-700">We could not load this product.</p>
      </main>
    );
  }

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ProductDetailView product={product} />
    </main>
  );
}
