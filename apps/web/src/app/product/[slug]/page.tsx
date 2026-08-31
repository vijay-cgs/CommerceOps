"use client";

import { notFound, useParams } from "next/navigation";
import { ProductDetailView } from "../../../components/storefront/product-detail-view";
import { getProductBySlug } from "../../../lib/storefront-data";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const product = params?.slug ? getProductBySlug(params.slug) : undefined;

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ProductDetailView product={product} />
    </main>
  );
}
