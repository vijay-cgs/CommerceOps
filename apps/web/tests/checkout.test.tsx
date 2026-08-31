import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import "@testing-library/jest-dom/vitest";
import { CartProvider } from "../src/components/storefront/cart-provider";
import CheckoutPage from "../src/app/checkout/page";

describe("checkout page", () => {
  it("renders the checkout shell with order summary", () => {
    render(
      <CartProvider>
        <CheckoutPage />
      </CartProvider>,
    );

    expect(screen.getByText("Checkout")).toBeInTheDocument();
    expect(screen.getByText("Order summary")).toBeInTheDocument();
  });
});
