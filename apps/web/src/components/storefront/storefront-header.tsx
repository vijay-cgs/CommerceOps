import Link from "next/link";

export function StorefrontHeader({ cartCount }: { cartCount: number }) {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-slate-900">
          CommerceCart
        </Link>
        <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex">
          <Link href="/products">Shop</Link>
          <Link href="/products">New arrivals</Link>
          <Link href="/inventory">Inventory</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth/dev-sign-in" className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800">
            Admin login
          </Link>
          <Link href="/cart" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
            Cart ({cartCount})
          </Link>
        </div>
      </div>
    </header>
  );
}
