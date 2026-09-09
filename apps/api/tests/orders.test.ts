import { describe, expect, it, vi } from "vitest";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));

vi.mock("../src/prisma/prisma.client", () => ({
  prismaClient: { order: { findFirst } },
}));

import {
  calculateShippingCents,
  getOrderForUser,
  mergeOrderLines,
} from "../src/orders/orders.service";

describe("mergeOrderLines", () => {
  it("collapses repeated SKUs into a single line", () => {
    const merged = mergeOrderLines([
      { productId: "product-1", sku: "BACKPACK-001", quantity: 2 },
      { productId: "product-1", sku: "BOTTLE-001", quantity: 1 },
      { productId: "product-1", sku: "BACKPACK-001", quantity: 3 },
    ]);

    expect(merged).toEqual([
      { productId: "product-1", sku: "BACKPACK-001", quantity: 5 },
      { productId: "product-1", sku: "BOTTLE-001", quantity: 1 },
    ]);
  });

  it("keeps sibling variants of one product separate", () => {
    const lines = [
      { productId: "product-1", sku: "SHOES-001-9", quantity: 1 },
      { productId: "product-1", sku: "SHOES-001-10", quantity: 2 },
    ];

    expect(mergeOrderLines(lines)).toEqual(lines);
  });
});

describe("calculateShippingCents", () => {
  it("charges flat shipping when the order has value", () => {
    expect(calculateShippingCents(12900)).toBe(1200);
  });

  it("charges nothing when the subtotal is zero", () => {
    expect(calculateShippingCents(0)).toBe(0);
  });
});

describe("getOrderForUser", () => {
  it("looks up an order by owner and order number", async () => {
    findFirst.mockResolvedValueOnce({
      id: "order-1",
      orderNumber: "CO-ABC-1234",
      status: "CONFIRMED",
      subtotalCents: 12900,
      shippingCents: 1200,
      totalCents: 14100,
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
      items: [],
    });

    await expect(getOrderForUser("user-1", "CO-ABC-1234")).resolves.toMatchObject({
      orderNumber: "CO-ABC-1234",
      totalCents: 14100,
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", orderNumber: "CO-ABC-1234" },
      include: { items: true },
    });
  });

  it("returns null when the order does not belong to the user", async () => {
    findFirst.mockResolvedValueOnce(null);

    await expect(getOrderForUser("user-1", "CO-OTHER-1234")).resolves.toBeNull();
  });
});
