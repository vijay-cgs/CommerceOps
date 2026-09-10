import { Controller, Get, HttpException, HttpStatus, Param, Query } from "@nestjs/common";
import type { ProductListResponse, ProductView } from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";
import { PRODUCT_INCLUDE, toProductViews } from "./product-view";

@Controller("products")
export class ProductsController {
  @Get()
  async listProducts(
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "24",
  ): Promise<ProductListResponse> {
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safePageSize = Math.min(1000, Math.max(1, Number.parseInt(pageSize, 10) || 24));
    const [products, totalCount] = await Promise.all([
      prismaClient.product.findMany({
        where: { status: "active" },
        orderBy: { createdAt: "asc" },
        include: PRODUCT_INCLUDE,
        skip: (safePage - 1) * safePageSize,
        take: safePageSize + 1,
      }),
      prismaClient.product.count({ where: { status: "active" } }),
    ]);
    const hasMore = products.length > safePageSize;
    const pageProducts = hasMore ? products.slice(0, safePageSize) : products;

    return {
      products: await toProductViews(pageProducts),
      page: safePage,
      pageSize: safePageSize,
      hasMore,
      totalCount,
    };
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
