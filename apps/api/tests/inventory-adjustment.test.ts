import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { InventoryController } from "../src/inventory/inventory.controller";
import { prismaClient } from "../src/prisma/prisma.client";

describe("inventory adjustment guards", () => {
  it("rejects stale expectedVersion updates", async () => {
    const controller = new InventoryController();
    const tx = {
      inventoryLevel: {
        findUnique: vi.fn().mockResolvedValue({
          id: "level-1",
          availableQty: 10,
          expectedVersion: 7,
        }),
      },
    };

    vi.spyOn(prismaClient, "$transaction").mockImplementation(async (callback) => {
      return callback(tx as never);
    });

    await expect(
      controller.adjustInventory(
        {
          authContext: {
            userId: "seed-inventory-001",
            role: "inventory_manager",
          },
          correlationId: "corr-123",
        } as never,
        {
          inventoryLevelId: "level-1",
          reasonCode: "cycle_count",
          deltaQty: 2,
          expectedVersion: 6,
          idempotencyKey: "idem-stale-001",
          note: "stale version check",
        },
      ),
    ).rejects.toMatchObject({
      response: {
        code: "version_conflict",
        message: "Inventory version is stale",
      },
    });
  });

  it("rejects duplicate idempotency keys", async () => {
    const controller = new InventoryController();
    const tx = {
      inventoryLevel: {
        findUnique: vi.fn().mockResolvedValue({
          id: "level-1",
          availableQty: 10,
          expectedVersion: 3,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      inventoryAdjustment: {
        create: vi.fn().mockRejectedValue(
          new Prisma.PrismaClientKnownRequestError(
            "Unique constraint failed on the fields: (`idempotencyKey`)",
            {
              code: "P2002",
              clientVersion: "test",
            },
          ),
        ),
      },
      auditEvent: {
        create: vi.fn(),
      },
    };

    vi.spyOn(prismaClient, "$transaction").mockImplementation(async (callback) => {
      return callback(tx as never);
    });

    await expect(
      controller.adjustInventory(
        {
          authContext: {
            userId: "seed-inventory-001",
            role: "inventory_manager",
          },
          correlationId: "corr-456",
        } as never,
        {
          inventoryLevelId: "level-1",
          reasonCode: "restock",
          deltaQty: 3,
          expectedVersion: 3,
          idempotencyKey: "duplicate-1",
        },
      ),
    ).rejects.toMatchObject({
      response: {
        code: "duplicate_idempotency_key",
        message: "Idempotency key has already been used",
      },
    });
  });

  it("accepts a valid adjustment and records result metadata", async () => {
    const controller = new InventoryController();
    const tx = {
      inventoryLevel: {
        findUnique: vi.fn().mockResolvedValue({
          id: "level-1",
          availableQty: 10,
          expectedVersion: 4,
        }),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      inventoryAdjustment: {
        create: vi.fn().mockResolvedValue({
          id: "adj-1",
          createdAt: new Date("2026-08-31T12:00:00.000Z"),
        }),
      },
      auditEvent: {
        create: vi.fn().mockResolvedValue({}),
      },
    };

    vi.spyOn(prismaClient, "$transaction").mockImplementation(async (callback) => {
      return callback(tx as never);
    });

    const result = await controller.adjustInventory(
      {
        authContext: {
          userId: "seed-inventory-001",
          role: "inventory_manager",
        },
        correlationId: "corr-789",
      } as never,
      {
        inventoryLevelId: "level-1",
        reasonCode: "sale",
        deltaQty: -2,
        expectedVersion: 4,
        idempotencyKey: "unique-okay-1",
      },
    );

    expect(result).toMatchObject({
      inventoryLevelId: "level-1",
      previousAvailable: 10,
      newAvailable: 8,
      updatedVersion: 5,
    });
    expect(tx.inventoryAdjustment.create).toHaveBeenCalledTimes(1);
    expect(tx.auditEvent.create).toHaveBeenCalledTimes(1);
  });

  it("rejects unauthorized role changes", async () => {
    const controller = new InventoryController();

    await expect(
      controller.adjustInventory(
        {
          authContext: {
            userId: "seed-readonly-001",
            role: "read_only",
          },
        } as never,
        {
          inventoryLevelId: "level-1",
          reasonCode: "cycle_count",
          deltaQty: 1,
          expectedVersion: 1,
          idempotencyKey: "readonly-block-1",
        },
      ),
    ).rejects.toMatchObject({
      response: {
        code: "forbidden",
        message: "You are not authorized to adjust inventory",
      },
    });
  });

  it("rejects adjustments that would push available stock below zero", async () => {
    const controller = new InventoryController();
    const tx = {
      inventoryLevel: {
        findUnique: vi.fn().mockResolvedValue({
          id: "level-1",
          availableQty: 2,
          expectedVersion: 3,
        }),
      },
    };

    vi.spyOn(prismaClient, "$transaction").mockImplementation(async (callback) => {
      return callback(tx as never);
    });

    await expect(
      controller.adjustInventory(
        {
          authContext: {
            userId: "seed-inventory-001",
            role: "inventory_manager",
          },
          correlationId: "corr-999",
        } as never,
        {
          inventoryLevelId: "level-1",
          reasonCode: "damaged_write_off",
          deltaQty: -5,
          expectedVersion: 3,
          idempotencyKey: "negative-guard-1",
        },
      ),
    ).rejects.toMatchObject({
      response: {
        code: "insufficient_stock",
        message: "Adjustment would make available inventory negative",
      },
    });
  });

  it("returns recent inventory adjustment history", async () => {
    const controller = new InventoryController();
    const findMany = vi.spyOn(prismaClient.inventoryAdjustment, "findMany").mockResolvedValue([
      {
        id: "adj-2",
        inventoryLevelId: "level-1",
        reasonCode: "manual_restock",
        deltaQty: 2,
        previousAvailable: 8,
        newAvailable: 10,
        idempotencyKey: "idem-002",
        correlationId: "corr-002",
        actorUserId: "seed-inventory-001",
        createdAt: new Date("2026-08-31T12:00:00.000Z"),
        inventoryLevel: {
          sku: "SKU-100",
          locationId: "A1",
        },
      },
    ]);

    const result = await controller.getInventoryHistory({
      authContext: {
        userId: "seed-inventory-001",
        role: "inventory_manager",
      },
    } as never);

    expect(findMany).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      items: [
        {
          id: "adj-2",
          sku: "SKU-100",
          locationId: "A1",
          reasonCode: "manual_restock",
          deltaQty: 2,
          previousAvailable: 8,
          newAvailable: 10,
          actorUserId: "seed-inventory-001",
        },
      ],
    });
  });
});
