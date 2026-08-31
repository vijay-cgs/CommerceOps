"use client";

import Link from "next/link";
import { ProductCard } from "../components/storefront/product-card";
import { useCart } from "../components/storefront/cart-provider";
import { useAuthUser } from "../components/providers/auth-provider";
import { canAccessInventory } from "../lib/roles";
import { products } from "../lib/storefront-data";

export default function HomePage() {
  const { itemCount } = useCart();
  const auth = useAuthUser();
  const featuredProducts = products.slice(0, 3);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <div>
          <p className="mb-4 inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
            Fresh finds
          </p>
          <h1 className="text-5xl font-black tracking-tight text-slate-900">
            Shop the latest essentials.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-slate-600">
            Curated gear for home, work, and everyday movement. Built for a fast, modern shopping
            experience.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="rounded-full bg-slate-900 px-6 py-3 font-medium text-white"
            >
              Shop now
            </Link>
            {!auth ? (
              <Link
                href="/register"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800"
              >
                Create an account
              </Link>
            ) : canAccessInventory(auth.role) ? (
              <Link
                href="/inventory"
                className="rounded-full border border-slate-300 bg-white px-6 py-3 font-medium text-slate-800"
              >
                View inventory
              </Link>
            ) : null}
          </div>
          <div className="mt-10 flex items-center gap-8 text-sm text-slate-600">
            <div>
              <p className="text-2xl font-bold text-slate-900">2.4k+</p>
              <p>happy shoppers</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">4.9/5</p>
              <p>average rating</p>
            </div>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -left-6 top-10 h-28 w-28 rounded-full bg-amber-200 blur-3xl" />
          <div className="absolute -right-6 bottom-10 h-32 w-32 rounded-full bg-violet-200 blur-3xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl">
            <div className="rounded-[1.5rem] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 p-6 text-white">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-300">
                Featured collection
              </p>
              <h2 className="mt-4 text-3xl font-bold">Smart daily carry</h2>
              <div className="mt-8 rounded-2xl bg-white/10 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-300">This week</p>
                <p className="mt-3 text-4xl font-black">30% off</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="shop" className="mx-auto max-w-6xl px-6 pb-16">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
              Trending
            </p>
            <h2 className="mt-2 text-3xl font-bold">Popular products</h2>
          </div>
          <Link href="/products" className="text-sm font-medium text-slate-700">
            See all products
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {featuredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      <section id="offers" className="bg-slate-900 py-16 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-6 md:grid-cols-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Free shipping</p>
            <p className="mt-3 text-2xl font-bold">Orders over $75</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Flexible returns</p>
            <p className="mt-3 text-2xl font-bold">30-day policy</p>
          </div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-300">Support</p>
            <p className="mt-3 text-2xl font-bold">Live help, always</p>
          </div>
        </div>
      </section>
    </main>
  );
}
