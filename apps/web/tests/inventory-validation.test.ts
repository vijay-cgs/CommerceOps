import { describe, expect, it } from "vitest";
import type { InventoryContextResponse } from "@commerceops/types";
import { validateDraft } from "../src/features/inventory/inventory-context-panel";

const context: InventoryContextResponse = {
  viewer: { userId: "user-1", role: "inventory_manager", canAdjust: true },
  levels: [
    {
      id: "level-1",
      sku: "BACKPACK-001",
      locationId: "warehouse-main",
      availableQty: 10,
      reservedQty: 0,
      incomingQty: 0,
      expectedVersion: 3,
      updatedAt: "2026-01-01T00:00:00.000Z",
    },
  ],
};

const validDraft = {
  inventoryLevelId: "level-1",
  reasonCode: "manual_restock",
  deltaInput: "5",
  note: "",
};

describe("validateDraft", () => {
  it("accepts a well formed draft and previews the resulting stock", () => {
    const result = validateDraft(context, validDraft);

    expect(result.errors).toEqual([]);
    expect(result.parsedDelta).toBe(5);
    expect(result.nextAvailable).toBe(15);
  });

  it("requires a level and a reason", () => {
    const result = validateDraft(context, {
      ...validDraft,
      inventoryLevelId: "",
      reasonCode: "",
    });

    expect(result.errors).toContain("Select an inventory level.");
    expect(result.errors).toContain("Select an adjustment reason.");
  });

  it("rejects a non-integer delta", () => {
    const result = validateDraft(context, { ...validDraft, deltaInput: "abc" });

    expect(result.errors).toContain("Enter an integer delta quantity.");
    expect(result.parsedDelta).toBeNull();
  });

  it("rejects a zero delta", () => {
    const result = validateDraft(context, { ...validDraft, deltaInput: "0" });

    expect(result.errors).toContain("Delta quantity cannot be zero.");
  });

  it("rejects an adjustment that would drive stock negative", () => {
    const result = validateDraft(context, { ...validDraft, deltaInput: "-11" });

    expect(result.errors).toContain("Adjustment would make available quantity negative.");
    expect(result.nextAvailable).toBe(-1);
  });

  it("allows an adjustment that lands exactly on zero", () => {
    const result = validateDraft(context, { ...validDraft, deltaInput: "-10" });

    expect(result.errors).toEqual([]);
    expect(result.nextAvailable).toBe(0);
  });

  it("rejects a note longer than 240 characters", () => {
    const result = validateDraft(context, { ...validDraft, note: "x".repeat(241) });

    expect(result.errors).toContain("Note must be 240 characters or fewer.");
  });

  it("flags a level that is no longer in the loaded context", () => {
    const result = validateDraft(context, { ...validDraft, inventoryLevelId: "missing" });

    expect(result.errors).toContain("Selected inventory level is not available.");
  });
});
