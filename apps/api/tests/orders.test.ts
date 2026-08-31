import { describe, expect, it } from "vitest";
import { calculateShippingCents, mergeOrderLines } from "../src/orders/orders.service";

describe("mergeOrderLines", () => {
  it("collapses repeated slugs into a single line", () => {
    const merged = mergeOrderLines([
      { slug: "aerolite-backpack", quantity: 2 },
      { slug: "terra-bottle", quantity: 1 },
      { slug: "aerolite-backpack", quantity: 3 },
    ]);

    expect(merged).toEqual([
      { slug: "aerolite-backpack", quantity: 5 },
      { slug: "terra-bottle", quantity: 1 },
    ]);
  });

  it("leaves distinct slugs untouched", () => {
    const lines = [
      { slug: "a", quantity: 1 },
      { slug: "b", quantity: 2 },
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
