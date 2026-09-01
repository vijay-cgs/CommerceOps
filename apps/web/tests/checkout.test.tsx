import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ProductView } from "@commerceops/types";

const backpack: ProductView = {
  id: "p1",
  slug: "aerolite-backpack",
  name: "AeroLite Backpack",
  description: "A backpack",
  tag: "Best seller",
  category: "Travel",
  accent: "from-sky-500 to-cyan-500",
  features: [],
  status: "active",
  optionName: null,
  variants: [
    {
      id: "v1",
      sku: "BACKPACK-001",
      optionValue: null,
      priceCents: 12900,
      isActive: true,
      availableQty: 10,
    },
  ],
};

vi.mock("../src/lib/catalog-api", () => ({
  fetchProducts: vi.fn(async () => [backpack]),
  submitOrder: vi.fn(),
  StorefrontApiError: class StorefrontApiError extends Error {},
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), refresh: vi.fn() }),
}));

import { CartProvider } from "../src/components/storefront/cart-provider";
import { CheckoutForm } from "../src/components/storefront/checkout-form";

function renderCheckout() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <CheckoutForm defaultName="Ada Lovelace" />
      </CartProvider>
    </QueryClientProvider>,
  );
}

describe("checkout form", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("prompts to keep shopping when the cart is empty", async () => {
    renderCheckout();

    expect(await screen.findByText("Your cart is empty.")).toBeInTheDocument();
  });

  it("prices the order from the catalog and adds shipping", async () => {
    window.localStorage.setItem(
      "commerceops.cart.v3",
      JSON.stringify([{ sku: "BACKPACK-001", quantity: 2 }]),
    );

    renderCheckout();

    await waitFor(() => {
      // 2 x $129.00 appears as both the line total and the subtotal.
      expect(screen.getAllByText("$258.00")).toHaveLength(2);
      expect(screen.getByText("$12.00")).toBeInTheDocument();
      expect(screen.getByText("$270.00")).toBeInTheDocument();
    });
  });

  it("prefills the shipping name from the signed-in user", async () => {
    window.localStorage.setItem(
      "commerceops.cart.v3",
      JSON.stringify([{ sku: "BACKPACK-001", quantity: 1 }]),
    );

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue("Ada Lovelace");
    });
  });

  it("ignores cart entries that are no longer in the catalog", async () => {
    window.localStorage.setItem(
      "commerceops.cart.v3",
      JSON.stringify([
        { sku: "BACKPACK-001", quantity: 1 },
        { sku: "DISCONTINUED-001", quantity: 5 },
      ]),
    );

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText("$141.00")).toBeInTheDocument();
    });
    expect(screen.queryByText(/discontinued/i)).not.toBeInTheDocument();
  });
});
