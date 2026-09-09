import { Prisma } from "@prisma/client";
import { HttpException, HttpStatus } from "@nestjs/common";
import type { ProductView } from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";
import { ensureInventoryLevelsForSkus } from "../inventory/inventory-helper";
import type { ProductUpsertDto, ProductVariantDto } from "./admin-products.dto";
import { PRODUCT_INCLUDE, toProductViews } from "./product-view";
import { getOrCreateSku } from "./sku-helper";

function conflict(message: string): HttpException {
  return new HttpException({ code: "conflict", message }, HttpStatus.CONFLICT);
}

function badRequest(code: string, message: string): HttpException {
  return new HttpException({ code, message }, HttpStatus.BAD_REQUEST);
}

function assertUniqueSkus(variants: ProductVariantDto[]): void {
  const seen = new Set<string>();

  for (const variant of variants) {
    if (seen.has(variant.sku)) {
      throw badRequest("duplicate_sku", `SKU ${variant.sku} is repeated on this product`);
    }
    seen.add(variant.sku);
  }
}

/**
 * A named option requires every variant to carry a value, otherwise shoppers
 * cannot tell the variants apart.
 */
function assertOptionShape(payload: ProductUpsertDto): void {
  const optionName = payload.optionName?.trim();

  if (!optionName) {
    if (payload.variants.length > 1) {
      throw badRequest(
        "option_name_required",
        "Name the option (for example Size) when a product has more than one variant",
      );
    }
    return;
  }

  const missing = payload.variants.filter((variant) => !variant.optionValue?.trim());

  if (missing.length > 0) {
    throw badRequest("option_value_required", `Every variant needs a ${optionName} value`);
  }
}

async function loadView(productId: string): Promise<ProductView> {
  const product = await prismaClient.product.findUniqueOrThrow({
    where: { id: productId },
    include: PRODUCT_INCLUDE,
  });

  const [view] = await toProductViews([product]);

  return view;
}

export async function listAllProducts(search?: string): Promise<ProductView[]> {
  const term = search?.trim();

  const products = await prismaClient.product.findMany({
    where: term
      ? {
          OR: [
            { name: { contains: term, mode: "insensitive" } },
            { slug: { contains: term, mode: "insensitive" } },
            { variants: { some: { sku: { contains: term, mode: "insensitive" } } } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    include: PRODUCT_INCLUDE,
    take: 100,
  });

  return toProductViews(products);
}

export async function createProduct(payload: ProductUpsertDto): Promise<ProductView> {
  assertUniqueSkus(payload.variants);
  assertOptionShape(payload);

  try {
    const created = await prismaClient.product.create({
      data: {
        slug: payload.slug,
        name: payload.name.trim(),
        description: payload.description.trim(),
        tag: payload.tag?.trim() || "New",
        category: payload.category.trim(),
        accent: payload.accent?.trim() || "from-sky-500 to-cyan-500",
        imageUrl: payload.imageUrl?.trim() || null,
        features: payload.features,
        status: payload.status,
        optionName: payload.optionName?.trim() || null,
        variants: {
          create: await Promise.all(
            payload.variants.map(async (variant, index) => ({
              sku: variant.sku,
              skuId: (await getOrCreateSku(variant.sku)).id,
              optionValue: variant.optionValue?.trim() || null,
              priceCents: variant.priceCents,
              isActive: variant.isActive ?? true,
              position: index,
            })),
          ),
        },
      },
    });

    if (payload.images?.length) {
      await prismaClient.productImage.createMany({
        data: payload.images.map((image, position) => ({
          productId: created.id,
          url: image.url.trim(),
          altText: image.altText?.trim() || null,
          position: image.position ?? position,
          isPrimary: image.isPrimary ?? position === 0,
        })),
      });
    }
    await ensureInventoryLevelsForSkus(payload.variants.map((v) => v.sku));

    return loadView(created.id);
  } catch (error) {
    throw translateWriteError(error);
  }
}

export async function updateProduct(id: string, payload: ProductUpsertDto): Promise<ProductView> {
  assertUniqueSkus(payload.variants);
  assertOptionShape(payload);

  const existing = await prismaClient.product.findUnique({
    where: { id },
    include: { variants: true },
  });

  if (!existing) {
    throw new HttpException(
      { code: "product_not_found", message: "Product does not exist" },
      HttpStatus.NOT_FOUND,
    );
  }

  const keptIds = new Set(payload.variants.map((variant) => variant.id).filter(Boolean));
  const removed = existing.variants.filter((variant) => !keptIds.has(variant.id));

  // A variant referenced by an order cannot be deleted without destroying order
  // history, so it is deactivated instead.
  const removedIds = removed.map((variant) => variant.id);
  const orderedVariantIds = removedIds.length
    ? new Set(
        (
          await prismaClient.orderItem.findMany({
            where: { variantId: { in: removedIds } },
            select: { variantId: true },
            distinct: ["variantId"],
          })
        ).map((item) => item.variantId),
      )
    : new Set<string>();

  try {
    await prismaClient.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: {
          slug: payload.slug,
          name: payload.name.trim(),
          description: payload.description.trim(),
          tag: payload.tag?.trim() || "New",
          category: payload.category.trim(),
          accent: payload.accent?.trim() || "from-sky-500 to-cyan-500",
          imageUrl: payload.imageUrl?.trim() || null,
          features: payload.features,
          status: payload.status,
          optionName: payload.optionName?.trim() || null,
        },
      });

      if (payload.images) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        await tx.productImage.createMany({
          data: payload.images.map((image, position) => ({
            productId: id,
            url: image.url.trim(),
            altText: image.altText?.trim() || null,
            position: image.position ?? position,
            isPrimary: image.isPrimary ?? position === 0,
          })),
        });
      }

      for (const variant of removed) {
        if (orderedVariantIds.has(variant.id)) {
          await tx.productVariant.update({
            where: { id: variant.id },
            data: { isActive: false },
          });
        } else {
          await tx.productVariant.delete({ where: { id: variant.id } });
        }
      }

      for (const [index, variant] of payload.variants.entries()) {
        const skuRecord = await getOrCreateSku(variant.sku, tx);
        const data = {
          sku: variant.sku,
          skuId: skuRecord.id,
          optionValue: variant.optionValue?.trim() || null,
          priceCents: variant.priceCents,
          isActive: variant.isActive ?? true,
          position: index,
        };

        if (variant.id) {
          await tx.productVariant.update({ where: { id: variant.id }, data });
        } else {
          await tx.productVariant.create({ data: { ...data, productId: id } });
        }
      }

      await ensureInventoryLevelsForSkus(
        payload.variants.map((v) => v.sku),
        tx,
      );
    });
  } catch (error) {
    throw translateWriteError(error);
  }

  return loadView(id);
}

export async function archiveProduct(id: string): Promise<ProductView> {
  const product = await prismaClient.product.findUnique({ where: { id } });

  if (!product) {
    throw new HttpException(
      { code: "product_not_found", message: "Product does not exist" },
      HttpStatus.NOT_FOUND,
    );
  }

  await prismaClient.product.update({ where: { id }, data: { status: "archived" } });

  return loadView(id);
}

function translateWriteError(error: unknown): unknown {
  if (error instanceof HttpException) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "value";

    return conflict(
      target.includes("sku")
        ? "That SKU is already used by another variant"
        : `A product with that ${target} already exists`,
    );
  }

  return error;
}
