import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { OrderView } from "@commerceops/types";

const { getAuthContext, notFound, redirect } = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("../src/lib/auth", () => ({ getAuthContext }));
vi.mock("next/navigation", () => ({ notFound, redirect }));

import OrderConfirmationPage from "../src/app/orders/[orderNumber]/page";

const order: OrderView = {
  id: "order-1",
  orderNumber: "CO-ABC/1234",
  status: "confirmed",
  subtotalCents: 12900,
  shippingCents: 1200,
  totalCents: 14100,
  createdAt: "2026-09-01T12:00:00.000Z",
  items: [
    {
      sku: "BACKPACK-001",
      name: "AeroLite Backpack",
      optionValue: "Blue",
      unitPriceCents: 12900,
      quantity: 1,
      lineTotalCents: 12900,
    },
  ],
};

function setAuthenticatedUser(): void {
  getAuthContext.mockResolvedValue({
    userId: "user-1",
    role: "customer",
    displayName: "Ada Lovelace",
    email: "ada@example.com",
    token: "test-token",
  });
}

function upstreamResponse(body: unknown, ok = true): Response {
  return new Response(JSON.stringify(body), {
    status: ok ? 200 : 404,
    headers: { "content-type": "application/json" },
  });
}

describe("order confirmation page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    notFound.mockImplementation(() => {
      throw new Error("not found");
    });
    redirect.mockImplementation(() => {
      throw new Error("redirected");
    });
  });

  it("redirects signed-out users to login", async () => {
    getAuthContext.mockResolvedValue(null);

    await expect(
      OrderConfirmationPage({ params: Promise.resolve({ orderNumber: "CO-ABC-1234" }) }),
    ).rejects.toThrow("redirected");

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("renders the order returned by the dedicated endpoint", async () => {
    setAuthenticatedUser();
    vi.mocked(fetch).mockResolvedValueOnce(upstreamResponse({ data: order }));

    render(
      await OrderConfirmationPage({ params: Promise.resolve({ orderNumber: order.orderNumber }) }),
    );

    expect(fetch).toHaveBeenCalledWith(
      "http://localhost:3002/api/v1/orders/CO-ABC%2F1234",
      expect.objectContaining({
        headers: { authorization: "Bearer test-token" },
        cache: "no-store",
      }),
    );
    expect(screen.getByText("Order confirmed")).toBeInTheDocument();
    expect(screen.getByText("CO-ABC/1234")).toBeInTheDocument();
    expect(screen.getByText("AeroLite Backpack (Blue) × 1")).toBeInTheDocument();
    expect(screen.getByText("$141.00")).toBeInTheDocument();
  });

  it("uses notFound when the order endpoint does not return an order", async () => {
    setAuthenticatedUser();
    vi.mocked(fetch).mockResolvedValueOnce(upstreamResponse({}, false));

    await expect(
      OrderConfirmationPage({ params: Promise.resolve({ orderNumber: "CO-MISSING-1234" }) }),
    ).rejects.toThrow("not found");

    expect(notFound).toHaveBeenCalledOnce();
  });
});
