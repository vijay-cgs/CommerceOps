import { Prisma } from "@prisma/client";
import { prismaClient } from "../prisma/prisma.client";

export const DEFAULT_LOCATION_ID = "warehouse-main";

export async function ensureInventoryLevelsForSkus(
  skus: string[],
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prismaClient;
  const uniqueSkus = [...new Set(skus.map((sku) => sku.trim()).filter((sku) => sku.length > 0))];

  if (uniqueSkus.length === 0) {
    return;
  }

  const existingLevels = await client.inventoryLevel.findMany({
    where: {
      sku: { in: uniqueSkus },
      locationId: DEFAULT_LOCATION_ID,
    },
    select: { sku: true },
  });

  const existingSkus = new Set(existingLevels.map((l) => l.sku));
  const missingSkus = uniqueSkus.filter((sku) => !existingSkus.has(sku));

  if (missingSkus.length > 0) {
    await client.inventoryLevel.createMany({
      data: missingSkus.map((sku) => ({
        sku,
        locationId: DEFAULT_LOCATION_ID,
        availableQty: 0,
        reservedQty: 0,
        incomingQty: 0,
        expectedVersion: 1,
      })),
      skipDuplicates: true,
    });
  }
}

export async function ensureInventoryLevelsForActiveVariants(
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prismaClient;
  const activeVariants = await client.productVariant.findMany({
    where: {
      isActive: true,
      product: { status: "active" },
    },
    select: { sku: true },
  });

  const skus = activeVariants.map((v) => v.sku);
  await ensureInventoryLevelsForSkus(skus, client);
}
