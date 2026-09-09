import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import type { OrderListResponse } from "@commerceops/types";

const { getAuthContext, redirect } = vi.hoisted(() => ({
  getAuthContext: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock("../src/lib/auth", () => ({ getAuthContext }));
vi.mock("next/navigation", () => ({ redirect }));

import OrdersPage from "../src/app/orders/page";

const orders: OrderListResponse = {
  orders: [
    {
      id: "order-1",
      orderNumber: "CO-ABC-1234",
      status: "confirmed",
      subtotalCents: 12900,
      shippingCents: 1200,
      totalCents: 14100,
      createdAt: "2026-09-01T12:00:00.000Z",
      items: [
        {
          sku: "BACKPACK-001",
          name: "AeroLite Backpack",
          optionValue: null,
          unitPriceCents: 12900,
          quantity: 1,
          lineTotalCents: 12900,
        },
      ],
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
    status: ok ? 200 : 500,
    headers: { "content-type": "application/json" },
  });
}

describe("orders page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("redirects signed-out users to login", async () => {
    getAuthContext.mockResolvedValue(null);
    redirect.mockImplementation(() => {
      throw new Error("redirected");
    });

    await expect(OrdersPage()).rejects.toThrow("redirected");
    expect(redirect).toHaveBeenCalledWith("/login?next=/orders");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("shows the empty state when the customer has no orders", async () => {
    setAuthenticatedUser();
    vi.mocked(fetch).mockResolvedValueOnce(upstreamResponse({ data: { orders: [] } }));

    render(await OrdersPage());

    expect(screen.getByRole("heading", { name: "Your orders" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "No orders yet" })).toBeInTheDocument();
    expect(screen.getByText(/completed purchases will appear here/i)).toBeInTheDocument();
  });

  it("renders order totals and links to order details", async () => {
    setAuthenticatedUser();
    vi.mocked(fetch).mockResolvedValueOnce(upstreamResponse({ data: orders }));

    render(await OrdersPage());

    expect(screen.getByText("CO-ABC-1234")).toBeInTheDocument();
    expect(screen.getByText("1 item")).toBeInTheDocument();
    expect(screen.getByText("$141.00")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view order details/i })).toHaveAttribute(
      "href",
      "/orders/CO-ABC-1234",
    );
  });

  it("shows an error state when the orders API fails", async () => {
    setAuthenticatedUser();
    vi.mocked(fetch).mockResolvedValueOnce(upstreamResponse({}, false));

    render(await OrdersPage());

    expect(screen.getByText("We could not load your orders.")).toBeInTheDocument();
    expect(screen.getByText("Please try again in a moment.")).toBeInTheDocument();
  });
});
