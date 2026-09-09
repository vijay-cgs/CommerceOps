import { HttpException, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { AdminSkuView, SkuUpsertRequest } from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";
import { ensureInventoryLevelsForSkus } from "../inventory/inventory-helper";
import type { SkuUpsertDto } from "./admin-skus.dto";

type SkuRecord = Prisma.ProductVariantGetPayload<{
  include: {
    product: { select: { name: true; slug: true } };
    skuRecord: { include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } };
    orderItems: { select: { id: true } };
  };
}>;

function toSkuView(sku: SkuRecord, availableQty: number): AdminSkuView {
  return {
    id: sku.id,
    sku: sku.sku,
    optionValue: sku.optionValue,
    priceCents: sku.priceCents,
    isActive: sku.isActive,
    isArchived: sku.skuRecord.isArchived,
    imageUrl: sku.skuRecord.imageUrl,
    images: sku.skuRecord.images,
    productId: sku.productId,
    productName: sku.product.name,
    productSlug: sku.product.slug,
    availableQty,
  };
}

async function stockForSku(sku: string): Promise<number> {
  const result = await prismaClient.inventoryLevel.aggregate({
    where: { sku },
    _sum: { availableQty: true },
  });

  return result._sum.availableQty ?? 0;
}

async function replaceSkuImages(
  skuId: string,
  images: SkuUpsertRequest["images"] | undefined,
): Promise<void> {
  if (!images) return;

  await prismaClient.skuImage.deleteMany({ where: { skuId } });
  await prismaClient.skuImage.createMany({
    data: images.map((image, position) => ({
      skuId,
      url: image.url.trim(),
      altText: image.altText?.trim() || null,
      position: image.position ?? position,
      isPrimary: image.isPrimary ?? position === 0,
    })),
  });
}

async function loadSku(id: string): Promise<SkuRecord> {
  return prismaClient.productVariant.findUniqueOrThrow({
    where: { id },
    include: {
      product: { select: { name: true, slug: true } },
      skuRecord: { include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } },
      orderItems: { select: { id: true } },
    },
  });
}

export async function listSkus(search?: string): Promise<AdminSkuView[]> {
  const term = search?.trim();
  const records = await prismaClient.productVariant.findMany({
    where: term
      ? {
          OR: [
            { sku: { contains: term, mode: "insensitive" } },
            { product: { name: { contains: term, mode: "insensitive" } } },
            { product: { slug: { contains: term, mode: "insensitive" } } },
          ],
        }
      : undefined,
    orderBy: { sku: "asc" },
    take: 100,
    include: {
      product: { select: { name: true, slug: true } },
      skuRecord: { include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } },
      orderItems: { select: { id: true } },
    },
  });

  const stock = await prismaClient.inventoryLevel.groupBy({
    by: ["sku"],
    where: { sku: { in: records.map((record) => record.sku) } },
    _sum: { availableQty: true },
  });
  const stockBySku = new Map(stock.map((level) => [level.sku, level._sum.availableQty ?? 0]));

  return records.map((record) => toSkuView(record, stockBySku.get(record.sku) ?? 0));
}

export async function createSku(payload: SkuUpsertDto): Promise<AdminSkuView> {
  try {
    const skuRecord = await prismaClient.sku.findUnique({ where: { code: payload.sku } });
    if (skuRecord?.isArchived) {
      throw new HttpException(
        { code: "sku_archived", message: "Archived SKUs cannot be linked to products" },
        HttpStatus.CONFLICT,
      );
    }
    const globalSku =
      skuRecord ??
      (await prismaClient.sku.create({
        data: { code: payload.sku, imageUrl: payload.imageUrl?.trim() || null },
      }));
    if (skuRecord && payload.imageUrl !== undefined) {
      await prismaClient.sku.update({
        where: { id: skuRecord.id },
        data: { imageUrl: payload.imageUrl?.trim() || null },
      });
    }
    await replaceSkuImages(globalSku.id, payload.images);

    const created = await prismaClient.productVariant.create({
      data: {
        sku: payload.sku,
        skuId: globalSku.id,
        productId: payload.productId,
        optionValue: payload.optionValue?.trim() || null,
        priceCents: payload.priceCents,
        isActive: payload.isActive ?? true,
      },
      include: {
        product: { select: { name: true, slug: true } },
        skuRecord: {
          include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } },
        },
        orderItems: { select: { id: true } },
      },
    });

    await ensureInventoryLevelsForSkus([created.sku]);
    return toSkuView(created, await stockForSku(created.sku));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new HttpException(
        { code: "duplicate_sku", message: "That SKU is already used by another variant" },
        HttpStatus.CONFLICT,
      );
    }

    throw error;
  }
}

export async function updateSku(id: string, payload: SkuUpsertRequest): Promise<AdminSkuView> {
  const existing = await loadSku(id);

  if (existing.orderItems.length > 0 && payload.sku !== existing.sku) {
    throw new HttpException(
      { code: "sku_immutable", message: "A SKU referenced by an order cannot be renamed" },
      HttpStatus.CONFLICT,
    );
  }

  const globalSku = await prismaClient.sku.findUnique({ where: { code: payload.sku } });
  if (globalSku?.isArchived) {
    throw new HttpException(
      { code: "sku_archived", message: "Archived SKUs cannot be linked to products" },
      HttpStatus.CONFLICT,
    );
  }
  const linkedSku =
    globalSku ??
    (await prismaClient.sku.create({
      data: { code: payload.sku, imageUrl: payload.imageUrl?.trim() || null },
    }));
  if (globalSku && payload.imageUrl !== undefined) {
    await prismaClient.sku.update({
      where: { id: globalSku.id },
      data: { imageUrl: payload.imageUrl?.trim() || null },
    });
  }
  await replaceSkuImages(linkedSku.id, payload.images);

  const updated = await prismaClient.productVariant.update({
    where: { id },
    data: {
      sku: payload.sku,
      skuId: linkedSku.id,
      productId: payload.productId,
      optionValue: payload.optionValue?.trim() || null,
      priceCents: payload.priceCents,
      isActive: payload.isActive ?? true,
    },
    include: {
      product: { select: { name: true, slug: true } },
      skuRecord: { include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } },
      orderItems: { select: { id: true } },
    },
  });

  await ensureInventoryLevelsForSkus([updated.sku]);
  return toSkuView(updated, await stockForSku(updated.sku));
}

export async function archiveSku(id: string): Promise<AdminSkuView> {
  const existing = await loadSku(id);
  await prismaClient.sku.update({ where: { id: existing.skuId }, data: { isArchived: true } });
  await prismaClient.productVariant.updateMany({
    where: { skuId: existing.skuId },
    data: { isActive: false },
  });
  const updated = await prismaClient.productVariant.update({
    where: { id },
    data: { isActive: false },
    include: {
      product: { select: { name: true, slug: true } },
      skuRecord: { include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } },
      orderItems: { select: { id: true } },
    },
  });

  return toSkuView(updated, await stockForSku(updated.sku));
}
