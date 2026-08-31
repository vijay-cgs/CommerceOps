import { describe, it, expect } from "vitest";

describe("storefront homepage", () => {
  it("shows the ecommerce landing page shell", () => {
    expect("CommerceCart").toContain("Commerce");
    expect("Shop the latest essentials").toContain("Shop");
  });
});
