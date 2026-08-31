"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "./storefront/cart-provider";
import { useAuthUser } from "./providers/auth-provider";
import { canAccessInventory, formatRole } from "../lib/roles";

export function NavHeader() {
  const router = useRouter();
  const { itemCount } = useCart();
  const auth = useAuthUser();

  const handleSignOut = async () => {
    await fetch("/auth/sign-out", { method: "POST" });
    router.refresh();
  };

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold tracking-tight">
          CommerceOps
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900">
            Shop
          </Link>

          {/* Show inventory link only when user has appropriate role */}
          {auth && canAccessInventory(auth.role) && (
            <Link
              href="/inventory"
              className="text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Inventory
            </Link>
          )}

          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="rounded bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
            >
              Cart ({itemCount})
            </Link>

            {auth ? (
              <>
                <span className="text-sm text-gray-600">
                  {auth.displayName}
                  {auth.role !== "customer" ? (
                    <span className="text-xs text-gray-500"> ({formatRole(auth.role)})</span>
                  ) : null}
                </span>
                <button
                  onClick={handleSignOut}
                  className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded bg-gray-900 px-3 py-2 text-sm text-white hover:bg-gray-800"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
