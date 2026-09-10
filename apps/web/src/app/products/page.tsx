"use client";

import { Suspense } from "react";
import { ProductCard } from "../../components/storefront/product-card";
import { useRouter, useSearchParams } from "next/navigation";
import { useProducts } from "../../lib/use-products";

function ProductsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const { data, isLoading, isError } = useProducts(page);

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">Shop</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight">All products</h1>
        </div>

        {isLoading ? (
          <p className="text-slate-600">Loading products…</p>
        ) : isError ? (
          <p className="text-red-700">We could not load the catalog. Please try again.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {data?.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
        {!isLoading && !isError && data ? (
          <div className="mt-8 flex items-center justify-between text-sm">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => goToPage(page - 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-slate-600">
              Page {page} of {Math.max(1, Math.ceil(data.totalCount / data.pageSize))}
            </span>
            <button
              type="button"
              disabled={!data.hasMore}
              onClick={() => goToPage(page + 1)}
              className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 text-slate-900">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <p className="text-slate-600">Loading products…</p>
          </div>
        </main>
      }
    >
      <ProductsPageContent />
    </Suspense>
  );
}
