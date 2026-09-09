"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProductVariantView, ProductView } from "@commerceops/types";
import { fetchProducts } from "../../lib/catalog-api";
import { queryKeys } from "../../lib/query-keys";
import { formatCents } from "../../lib/money";

const STORAGE_KEY = "commerceops.cart.v4";
const MAX_QUANTITY = 99;

type CartEntry = {
  productId: string;
  sku: string;
  quantity: number;
};

type CartItem = {
  product: ProductView;
  variant: ProductVariantView;
  quantity: number;
};

type CartContextValue = {
  entries: CartEntry[];
  items: CartItem[];
  itemCount: number;
  subtotalCents: number;
  isCatalogLoading: boolean;
  addToCart: (variant: ProductVariantView, quantity?: number) => void;
  updateQuantity: (sku: string, delta: number) => void;
  removeFromCart: (sku: string) => void;
  clearCart: () => void;
  formatMoney: (cents: number) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

// Only SKU and quantity are stored, so prices always come from the catalog and
// a tampered or stale localStorage value cannot influence what is charged.
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
      const productId = (entry as { productId?: unknown })?.productId;
      const sku = (entry as { sku?: unknown })?.sku;
      const quantity = Number((entry as { quantity?: unknown })?.quantity);

      if (
        typeof productId !== "string" ||
        typeof sku !== "string" ||
        !Number.isInteger(quantity) ||
        quantity < 1
      ) {
        return [];
      }

      return [{ productId, sku, quantity: Math.min(quantity, MAX_QUANTITY) }];
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
    const byProductSku = new Map<string, { product: ProductView; variant: ProductVariantView }>();

    for (const product of productsQuery.data ?? []) {
      for (const variant of product.variants) {
        byProductSku.set(`${product.id}:${variant.sku}`, { product, variant });
      }
    }

    const items = entries.flatMap((entry) => {
      const match = byProductSku.get(`${entry.productId}:${entry.sku}`);
      return match ? [{ ...match, quantity: entry.quantity }] : [];
    });

    return {
      entries,
      items,
      // Counted from entries so the badge is right before the catalog loads.
      itemCount: entries.reduce((total, entry) => total + entry.quantity, 0),
      subtotalCents: items.reduce(
        (total, item) => total + item.variant.priceCents * item.quantity,
        0,
      ),
      isCatalogLoading: productsQuery.isLoading,
      addToCart: (variant, quantity = 1) => {
        setEntries((current) => {
          const existing = current.find(
            (entry) => entry.productId === variant.productId && entry.sku === variant.sku,
          );

          if (existing) {
            return current.map((entry) =>
              entry.productId === variant.productId && entry.sku === variant.sku
                ? { ...entry, quantity: Math.min(entry.quantity + quantity, MAX_QUANTITY) }
                : entry,
            );
          }

          return [
            ...current,
            {
              productId: variant.productId,
              sku: variant.sku,
              quantity: Math.min(quantity, MAX_QUANTITY),
            },
          ];
        });
      },
      updateQuantity: (key, delta) => {
        setEntries((current) =>
          current
            .map((entry) =>
              `${entry.productId}:${entry.sku}` === key
                ? { ...entry, quantity: Math.min(entry.quantity + delta, MAX_QUANTITY) }
                : entry,
            )
            .filter((entry) => entry.quantity > 0),
        );
      },
      removeFromCart: (key) => {
        setEntries((current) =>
          current.filter((entry) => `${entry.productId}:${entry.sku}` !== key),
        );
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
