import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { ProductView } from "@commerceops/types";

const backpack: ProductView = {
  id: "p1",
  slug: "aerolite-backpack",
  sku: "BACKPACK-001",
  name: "AeroLite Backpack",
  description: "A backpack",
  priceCents: 12900,
  tag: "Best seller",
  category: "Travel",
  accent: "from-sky-500 to-cyan-500",
  features: [],
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
      "commerceops.cart.v2",
      JSON.stringify([{ slug: "aerolite-backpack", quantity: 2 }]),
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
      "commerceops.cart.v2",
      JSON.stringify([{ slug: "aerolite-backpack", quantity: 1 }]),
    );

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByLabelText(/full name/i)).toHaveValue("Ada Lovelace");
    });
  });

  it("ignores cart entries that are no longer in the catalog", async () => {
    window.localStorage.setItem(
      "commerceops.cart.v2",
      JSON.stringify([
        { slug: "aerolite-backpack", quantity: 1 },
        { slug: "discontinued-item", quantity: 5 },
      ]),
    );

    renderCheckout();

    await waitFor(() => {
      expect(screen.getByText("$141.00")).toBeInTheDocument();
    });
    expect(screen.queryByText(/discontinued/i)).not.toBeInTheDocument();
  });
});
