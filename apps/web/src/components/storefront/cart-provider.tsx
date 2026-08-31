"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import type { Product } from "../../lib/storefront-data";
import { formatCurrency } from "../../lib/storefront-data";

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

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.slug === product.slug);

      if (existing) {
        return current.map((item) =>
          item.product.slug === product.slug
            ? { ...item, quantity: item.quantity + quantity }
            : item,
        );
      }

      return [...current, { product, quantity }];
    });
  };

  const updateQuantity = (productSlug: string, delta: number) => {
    setItems((current) =>
      current
        .map((item) =>
          item.product.slug === productSlug
            ? { ...item, quantity: item.quantity + delta }
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

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

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
