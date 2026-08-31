"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Product } from "../../lib/storefront-data";
import { formatCurrency, getProductBySlug } from "../../lib/storefront-data";

const STORAGE_KEY = "commerceops.cart.v1";
const MAX_QUANTITY = 12;

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  updateQuantity: (productSlug: string, delta: number) => void;
  removeFromCart: (productSlug: string) => void;
  clearCart: () => void;
  formatMoney: (value: number) => string;
};

const CartContext = createContext<CartContextValue | null>(null);

// Only slug and quantity are stored, so prices and copy always come from the
// current catalog and stale product snapshots can never be resurrected.
function readStoredCart(): CartItem[] {
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

      const product = getProductBySlug(slug);

      return product ? [{ product, quantity: Math.min(quantity, MAX_QUANTITY) }] : [];
    });
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Read after mount so the server and first client render agree.
  useEffect(() => {
    setItems(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items.map((item) => ({ slug: item.product.slug, quantity: item.quantity }))),
      );
    } catch {
      // Storage can be full or blocked; the in-memory cart still works.
    }
  }, [items, hydrated]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.slug === product.slug);

      if (existing) {
        return current.map((item) =>
          item.product.slug === product.slug
            ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_QUANTITY) }
            : item,
        );
      }

      return [...current, { product, quantity: Math.min(quantity, MAX_QUANTITY) }];
    });
  };

  const updateQuantity = (productSlug: string, delta: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product.slug === productSlug
            ? { ...item, quantity: Math.min(item.quantity + delta, MAX_QUANTITY) }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeFromCart = (productSlug: string) => {
    setItems((current) => current.filter((item) => item.product.slug !== productSlug));
  };

  const clearCart = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((total, item) => total + item.product.price * item.quantity, 0),
    [items],
  );

  const itemCount = useMemo(() => items.reduce((total, item) => total + item.quantity, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      subtotal,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      formatMoney: formatCurrency,
    }),
    [items, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}
