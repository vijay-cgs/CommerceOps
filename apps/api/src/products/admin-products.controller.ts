import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { Request } from "express";
import type { ProductListResponse, ProductView, UserRole } from "@commerceops/types";
import { ProductUpsertDto } from "./admin-products.dto";
import {
  archiveProduct,
  createProduct,
  listAllProducts,
  updateProduct,
} from "./admin-products.service";

function canManageProducts(role: UserRole): boolean {
  return role === "admin" || role === "inventory_manager";
}

function requireProductManager(req: Request): Express.AuthContext {
  const auth = req.authContext;

  if (!auth) {
    throw new HttpException(
      { code: "unauthorized", message: "Sign in to continue" },
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (!canManageProducts(auth.role)) {
    throw new HttpException(
      { code: "forbidden", message: "You are not authorized to manage products" },
      HttpStatus.FORBIDDEN,
    );
  }

  return auth;
}

@Controller("admin/products")
export class AdminProductsController {
  @Get()
  async list(@Req() req: Request, @Query("search") search?: string): Promise<ProductListResponse> {
    requireProductManager(req);

    return { products: await listAllProducts(search) };
  }

  @Post()
  async create(@Req() req: Request, @Body() body: ProductUpsertDto): Promise<ProductView> {
    requireProductManager(req);

    return createProduct(body);
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: ProductUpsertDto,
  ): Promise<ProductView> {
    requireProductManager(req);

    return updateProduct(id, body);
  }

  @Delete(":id")
  async archive(@Req() req: Request, @Param("id") id: string): Promise<ProductView> {
    requireProductManager(req);

    return archiveProduct(id);
  }
}
