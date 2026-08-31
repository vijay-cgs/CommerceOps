import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import type { ProductListResponse, ProductView } from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";

type ProductRecord = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  tag: string;
  category: string;
  accent: string;
  features: string[];
};

function toProductView(product: ProductRecord): ProductView {
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: product.name,
    description: product.description,
    priceCents: product.priceCents,
    tag: product.tag,
    category: product.category,
    accent: product.accent,
    features: product.features,
  };
}

const PRODUCT_FIELDS = {
  id: true,
  slug: true,
  sku: true,
  name: true,
  description: true,
  priceCents: true,
  tag: true,
  category: true,
  accent: true,
  features: true,
} as const;

@Controller("products")
export class ProductsController {
  @Get()
  async listProducts(): Promise<ProductListResponse> {
    const products = await prismaClient.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
      select: PRODUCT_FIELDS,
    });

    return { products: products.map(toProductView) };
  }

  @Get(":slug")
  async getProduct(@Param("slug") slug: string): Promise<ProductView> {
    const product = await prismaClient.product.findFirst({
      where: { slug, isActive: true },
      select: PRODUCT_FIELDS,
    });

    if (!product) {
      throw new HttpException(
        { code: "product_not_found", message: "Product does not exist" },
        HttpStatus.NOT_FOUND,
      );
    }

    return toProductView(product);
  }
}
