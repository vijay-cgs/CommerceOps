import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import type { AdminSkuListResponse, AdminSkuView } from "@commerceops/types";
import { requireProductManager } from "./product-manager-auth";
import { SkuUpsertDto } from "./admin-skus.dto";
import { archiveSku, createSku, listSkus, updateSku } from "./admin-skus.service";

@Controller("admin/skus")
export class AdminSkusController {
  @Get()
  async list(
    @Req() req: Request,
    @Query("search") search?: string,
    @Query("page") page = "1",
    @Query("pageSize") pageSize = "25",
  ): Promise<AdminSkuListResponse> {
    requireProductManager(req);
    const safePage = Math.max(1, Number.parseInt(page, 10) || 1);
    const safePageSize = Math.min(100, Math.max(1, Number.parseInt(pageSize, 10) || 25));
    const result = await listSkus(search, safePage, safePageSize);
    return { ...result, page: safePage, pageSize: safePageSize };
  }

  @Post()
  async create(@Req() req: Request, @Body() body: SkuUpsertDto): Promise<AdminSkuView> {
    requireProductManager(req);
    return createSku(body);
  }

  @Patch(":id")
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: SkuUpsertDto,
  ): Promise<AdminSkuView> {
    requireProductManager(req);
    return updateSku(id, body);
  }

  @Delete(":id")
  async archive(@Req() req: Request, @Param("id") id: string): Promise<AdminSkuView> {
    requireProductManager(req);
    return archiveSku(id);
  }
}
