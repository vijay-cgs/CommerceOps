"use client";

import { notFound, useParams } from "next/navigation";
import { ProductDetailView } from "../../../components/storefront/product-detail-view";
import { useCart } from "../../../components/storefront/cart-provider";
import { StorefrontHeader } from "../../../components/storefront/storefront-header";
import { getProductBySlug } from "../../../lib/storefront-data";

export default function ProductDetailPage() {
  const params = useParams<{ slug: string }>();
  const { itemCount } = useCart();
  const product = params?.slug ? getProductBySlug(params.slug) : undefined;

  if (!product) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <StorefrontHeader cartCount={itemCount} />
      <ProductDetailView product={product} />
    </main>
  );
}
