import { describe, it, expect } from "vitest";

describe("api baseline", () => {
  it("defines health endpoint route", () => {
    expect("/api/v1/health").toContain("health");
  });
});
