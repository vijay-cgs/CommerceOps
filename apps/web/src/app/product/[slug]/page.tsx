"use client";

import { notFound, useParams } from "next/navigation";
import { ProductDetailView } from "../../../components/storefront/product-detail-view";
import { useProducts } from "../../../lib/use-products";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const { data: products, isLoading, isError } = useProducts();

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <p className="mx-auto max-w-6xl text-slate-600">Loading product…</p>
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
        <p className="mx-auto max-w-6xl text-red-700">We could not load this product.</p>
      </main>
    );
  }

  const product = products?.find((candidate) => candidate.slug === params?.slug);

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ProductDetailView product={product} />
    </main>
  );
}
