import { describe, expect, it } from "vitest";
import { calculateShippingCents, mergeOrderLines } from "../src/orders/orders.service";

describe("mergeOrderLines", () => {
  it("collapses repeated SKUs into a single line", () => {
    const merged = mergeOrderLines([
      { sku: "BACKPACK-001", quantity: 2 },
      { sku: "BOTTLE-001", quantity: 1 },
      { sku: "BACKPACK-001", quantity: 3 },
    ]);

    expect(merged).toEqual([
      { sku: "BACKPACK-001", quantity: 5 },
      { sku: "BOTTLE-001", quantity: 1 },
    ]);
  });

  it("keeps sibling variants of one product separate", () => {
    const lines = [
      { sku: "SHOES-001-9", quantity: 1 },
      { sku: "SHOES-001-10", quantity: 2 },
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
