import { Controller, Get, HttpException, HttpStatus, Param } from "@nestjs/common";
import type { ProductListResponse, ProductView } from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";
import { PRODUCT_INCLUDE, toProductViews } from "./product-view";

@Controller("products")
export class ProductsController {
  @Get()
  async listProducts(): Promise<ProductListResponse> {
    const products = await prismaClient.product.findMany({
      where: { status: "active" },
      orderBy: { createdAt: "asc" },
      include: PRODUCT_INCLUDE,
    });

    return { products: await toProductViews(products) };
  }

  @Get(":slug")
  async getProduct(@Param("slug") slug: string): Promise<ProductView> {
    const product = await prismaClient.product.findFirst({
      where: { slug, status: "active" },
      include: PRODUCT_INCLUDE,
    });

    if (!product) {
      throw new HttpException(
        { code: "product_not_found", message: "Product does not exist" },
        HttpStatus.NOT_FOUND,
      );
    }

    const [view] = await toProductViews([product]);

    return view;
  }
}
