import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req } from "@nestjs/common";
import type { Request } from "express";
import type { AdminSkuListResponse, AdminSkuView } from "@commerceops/types";
import { requireProductManager } from "./product-manager-auth";
import { SkuUpsertDto } from "./admin-skus.dto";
import { archiveSku, createSku, listSkus, updateSku } from "./admin-skus.service";

@Controller("admin/skus")
export class AdminSkusController {
  @Get()
  async list(@Req() req: Request, @Query("search") search?: string): Promise<AdminSkuListResponse> {
    requireProductManager(req);
    return { skus: await listSkus(search) };
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
