"use client";

import { ProductCard } from "../../components/storefront/product-card";
import { useCart } from "../../components/storefront/cart-provider";
import { StorefrontHeader } from "../../components/storefront/storefront-header";
import { products } from "../../lib/storefront-data";

export default function ProductsPage() {
  const { itemCount } = useCart();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <StorefrontHeader cartCount={itemCount} />
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Shop</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">All products</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </main>
  );
}
