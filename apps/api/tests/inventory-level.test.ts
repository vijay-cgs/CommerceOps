import { describe, expect, it, vi } from "vitest";
import {
  ensureInventoryLevelsForSkus,
  DEFAULT_LOCATION_ID,
} from "../src/inventory/inventory-helper";

describe("ensureInventoryLevelsForSkus", () => {
  it("creates missing inventory levels at default location with 0 stock", async () => {
    const findManyMock = vi.fn().mockResolvedValue([{ sku: "EXISTING-001" }]);
    const createManyMock = vi.fn().mockResolvedValue({ count: 1 });

    const tx = {
      inventoryLevel: {
        findMany: findManyMock,
        createMany: createManyMock,
      },
    };

    await ensureInventoryLevelsForSkus(["EXISTING-001", "PROBE-TEE-S"], tx as never);

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        sku: { in: ["EXISTING-001", "PROBE-TEE-S"] },
        locationId: DEFAULT_LOCATION_ID,
      },
      select: { sku: true },
    });

    expect(createManyMock).toHaveBeenCalledWith({
      data: [
        {
          sku: "PROBE-TEE-S",
          locationId: DEFAULT_LOCATION_ID,
          availableQty: 0,
          reservedQty: 0,
          incomingQty: 0,
          expectedVersion: 1,
        },
      ],
      skipDuplicates: true,
    });
  });

  it("does nothing if all skus already have inventory levels", async () => {
    const findManyMock = vi.fn().mockResolvedValue([{ sku: "SKU-1" }]);
    const createManyMock = vi.fn();

    const tx = {
      inventoryLevel: {
        findMany: findManyMock,
        createMany: createManyMock,
      },
    };

    await ensureInventoryLevelsForSkus(["SKU-1"], tx as never);

    expect(createManyMock).not.toHaveBeenCalled();
  });
});
