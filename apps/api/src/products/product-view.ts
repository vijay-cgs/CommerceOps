import { Prisma } from "@prisma/client";
import type { ImageView, ProductStatus, ProductView } from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";

type VariantRecord = {
  id: string;
  productId: string;
  sku: string;
  skuRecord: { isArchived: boolean; imageUrl: string | null; images: ImageView[] };
  optionValue: string | null;
  priceCents: number;
  isActive: boolean;
  position: number;
};

type ProductRecord = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tag: string;
  category: string;
  accent: string;
  imageUrl: string | null;
  images: ImageView[];
  features: string[];
  status: string;
  optionName: string | null;
  variants: VariantRecord[];
};

export const PRODUCT_INCLUDE = {
  variants: {
    orderBy: [{ position: "asc" }, { sku: "asc" }],
    include: {
      skuRecord: { include: { images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] } } },
    },
  },
  images: { orderBy: [{ position: "asc" }, { createdAt: "asc" }] },
} satisfies Prisma.ProductInclude;

/**
 * Stock lives in InventoryLevel keyed by SKU, so it is looked up separately and
 * summed across locations.
 */
export async function stockBySku(skus: string[]): Promise<Map<string, number>> {
  if (skus.length === 0) {
    return new Map();
  }

  const levels = await prismaClient.inventoryLevel.groupBy({
    by: ["sku"],
    where: { sku: { in: skus } },
    _sum: { availableQty: true },
  });

  return new Map(levels.map((level) => [level.sku, level._sum.availableQty ?? 0]));
}

export function toProductView(product: ProductRecord, stock: Map<string, number>): ProductView {
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    tag: product.tag,
    category: product.category,
    accent: product.accent,
    imageUrl: product.imageUrl,
    images: product.images,
    features: product.features,
    status: product.status as ProductStatus,
    optionName: product.optionName,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      imageUrl: variant.skuRecord.imageUrl,
      images: variant.skuRecord.images,
      optionValue: variant.optionValue,
      priceCents: variant.priceCents,
      isActive: variant.isActive && !variant.skuRecord.isArchived,
      availableQty: stock.get(variant.sku) ?? 0,
    })),
  };
}

export async function toProductViews(products: ProductRecord[]): Promise<ProductView[]> {
  const stock = await stockBySku(products.flatMap((p) => p.variants.map((v) => v.sku)));

  return products.map((product) => toProductView(product, stock));
}
