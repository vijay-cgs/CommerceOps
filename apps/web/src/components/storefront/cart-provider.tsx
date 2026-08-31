"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProductView } from "@commerceops/types";
import { fetchProducts } from "../../lib/catalog-api";
import { queryKeys } from "../../lib/query-keys";
import { formatCents } from "../../lib/money";

const STORAGE_KEY = "commerceops.cart.v2";
const MAX_QUANTITY = 99;

type CartEntry = {
  slug: string;
  quantity: number;
};

type CartItem = {
  product: ProductView;
  quantity: number;
};

type CartContextValue = {
  entries: CartEntry[];
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  isCatalogLoading: boolean;
  addToCart: (product: ProductView, quantity?: number) => void;
  updateQuantity: (productSlug: string, delta: number) => void;
  removeFromCart: (productSlug: string) => void;
  clearCart: () => void;
  formatMoney: (cents: number) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

// Only slug and quantity are stored, so prices always come from the catalog and
// a tampered or stale localStorage value can never influence what is charged.
function readStoredCart(): CartEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((entry) => {
      const slug = (entry as { slug?: unknown })?.slug;
      const quantity = Number((entry as { quantity?: unknown })?.quantity);

      if (typeof slug !== "string" || !Number.isInteger(quantity) || quantity < 1) {
        return [];
      }

      return [{ slug, quantity: Math.min(quantity, MAX_QUANTITY) }];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<CartEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  const productsQuery = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
    staleTime: 60_000,
  });

  // Read after mount so the server and first client render agree.
  useEffect(() => {
    setEntries(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Storage can be full or blocked; the in-memory cart still works.
    }
  }, [entries, hydrated]);

  const value = useMemo<CartContextValue>(() => {
    const catalog = new Map((productsQuery.data ?? []).map((product) => [product.slug, product]));

    const items = entries.flatMap((entry) => {
      const product = catalog.get(entry.slug);
      return product ? [{ product, quantity: entry.quantity }] : [];
    });

    return {
      entries,
      items,
      // Counted from entries so the badge is right before the catalog loads.
      itemCount: entries.reduce((total, entry) => total + entry.quantity, 0),
      subtotalCents: items.reduce(
        (total, item) => total + item.product.priceCents * item.quantity,
        0,
      ),
      isCatalogLoading: productsQuery.isLoading,
      addToCart: (product, quantity = 1) => {
        setEntries((current) => {
          const existing = current.find((entry) => entry.slug === product.slug);

          if (existing) {
            return current.map((entry) =>
              entry.slug === product.slug
                ? { ...entry, quantity: Math.min(entry.quantity + quantity, MAX_QUANTITY) }
                : entry,
            );
          }

          return [...current, { slug: product.slug, quantity: Math.min(quantity, MAX_QUANTITY) }];
        });
      },
      updateQuantity: (productSlug, delta) => {
        setEntries((current) =>
          current
            .map((entry) =>
              entry.slug === productSlug
                ? { ...entry, quantity: Math.min(entry.quantity + delta, MAX_QUANTITY) }
                : entry,
            )
            .filter((entry) => entry.quantity > 0),
        );
      },
      removeFromCart: (productSlug) => {
        setEntries((current) => current.filter((entry) => entry.slug !== productSlug));
      },
      clearCart: () => setEntries([]),
      formatMoney: formatCents,
    };
  }, [entries, productsQuery.data, productsQuery.isLoading]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
