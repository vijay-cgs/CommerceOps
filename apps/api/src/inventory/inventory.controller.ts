import { Body, Controller, Get, HttpException, HttpStatus, Post, Req } from "@nestjs/common";
import type { Request } from "express";
import { Prisma } from "@prisma/client";
import type {
  InventoryAdjustRequest,
  InventoryAdjustResponse,
  InventoryAdjustmentHistoryResponse,
  InventoryContextResponse,
  UserRole,
} from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";

function canAdjustInventory(role: UserRole): boolean {
  return role === "admin" || role === "inventory_manager";
}

function validateAdjustmentPayload(payload: Partial<InventoryAdjustRequest>): string[] {
  const errors: string[] = [];

  if (!payload.inventoryLevelId || payload.inventoryLevelId.trim().length === 0) {
    errors.push("inventoryLevelId is required");
  }

  if (!payload.reasonCode || payload.reasonCode.trim().length === 0) {
    errors.push("reasonCode is required");
  }

  if (!Number.isInteger(payload.deltaQty) || payload.deltaQty === 0) {
    errors.push("deltaQty must be a non-zero integer");
  }

  const expectedVersion = payload.expectedVersion;
  if (!Number.isInteger(expectedVersion) || (expectedVersion as number) < 1) {
    errors.push("expectedVersion must be an integer greater than 0");
  }

  if (!payload.idempotencyKey || payload.idempotencyKey.trim().length === 0) {
    errors.push("idempotencyKey is required");
  }

  if (payload.note && payload.note.length > 240) {
    errors.push("note must be 240 characters or fewer");
  }

  return errors;
}

@Controller("inventory")
export class InventoryController {
  @Get("context")
  async getInventoryContext(@Req() req: Request): Promise<InventoryContextResponse> {
    const auth = req.authContext;

    if (!auth) {
      return {
        viewer: {
          userId: "unknown",
          role: "read_only",
          canAdjust: false,
        },
        levels: [],
      };
    }

    const levels = await prismaClient.inventoryLevel.findMany({
      orderBy: [
        { locationId: "asc" },
        { sku: "asc" },
      ],
      take: 100,
    });

    return {
      viewer: {
        userId: auth.userId,
        role: auth.role,
        canAdjust: canAdjustInventory(auth.role),
      },
      levels: levels.map((level) => ({
        id: level.id,
        sku: level.sku,
        locationId: level.locationId,
        availableQty: level.availableQty,
        reservedQty: level.reservedQty,
        incomingQty: level.incomingQty,
        expectedVersion: level.expectedVersion,
        updatedAt: level.updatedAt.toISOString(),
      })),
    };
  }

  @Get("history")
  async getInventoryHistory(@Req() req: Request): Promise<InventoryAdjustmentHistoryResponse> {
    const auth = req.authContext;

    if (!auth) {
      return {
        items: [],
      };
    }

    const adjustments = await prismaClient.inventoryAdjustment.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
      include: {
        inventoryLevel: {
          select: {
            sku: true,
            locationId: true,
          },
        },
      },
    });

    return {
      items: adjustments.map((adjustment) => ({
        id: adjustment.id,
        inventoryLevelId: adjustment.inventoryLevelId,
        sku: adjustment.inventoryLevel.sku,
        locationId: adjustment.inventoryLevel.locationId,
        reasonCode: adjustment.reasonCode,
        deltaQty: adjustment.deltaQty,
        previousAvailable: adjustment.previousAvailable,
        newAvailable: adjustment.newAvailable,
        actorUserId: adjustment.actorUserId,
        createdAt: adjustment.createdAt.toISOString(),
      })),
    };
  }

  @Post("adjust")
  async adjustInventory(
    @Req() req: Request,
    @Body() payload: Partial<InventoryAdjustRequest>,
  ): Promise<InventoryAdjustResponse> {
    const auth = req.authContext;
    if (!auth || !canAdjustInventory(auth.role)) {
      throw new HttpException(
        {
          code: "forbidden",
          message: "You are not authorized to adjust inventory",
        },
        HttpStatus.FORBIDDEN,
      );
    }

    const validationErrors = validateAdjustmentPayload(payload);
    if (validationErrors.length > 0) {
      throw new HttpException(
        {
          code: "validation_error",
          message: "Invalid inventory adjustment payload",
          details: validationErrors,
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    const typedPayload = payload as InventoryAdjustRequest;
    const correlationId = req.correlationId ?? "unknown";

    try {
      const result = await prismaClient.$transaction(async (tx) => {
        const existingLevel = await tx.inventoryLevel.findUnique({
          where: { id: typedPayload.inventoryLevelId },
        });

        if (!existingLevel) {
          throw new HttpException(
            {
              code: "inventory_level_not_found",
              message: "Inventory level does not exist",
            },
            HttpStatus.NOT_FOUND,
          );
        }

        if (existingLevel.expectedVersion !== typedPayload.expectedVersion) {
          throw new HttpException(
            {
              code: "version_conflict",
              message: "Inventory version is stale",
            },
            HttpStatus.CONFLICT,
          );
        }

        const previousAvailable = existingLevel.availableQty;
        const newAvailable = previousAvailable + typedPayload.deltaQty;

        if (newAvailable < 0) {
          throw new HttpException(
            {
              code: "insufficient_stock",
              message: "Adjustment would make available inventory negative",
            },
            HttpStatus.BAD_REQUEST,
          );
        }

        const updatedRows = await tx.inventoryLevel.updateMany({
          where: {
            id: existingLevel.id,
            expectedVersion: typedPayload.expectedVersion,
          },
          data: {
            availableQty: newAvailable,
            expectedVersion: {
              increment: 1,
            },
          },
        });

        if (updatedRows.count !== 1) {
          throw new HttpException(
            {
              code: "version_conflict",
              message: "Inventory version changed during update",
            },
            HttpStatus.CONFLICT,
          );
        }

        const createdAdjustment = await tx.inventoryAdjustment.create({
          data: {
            inventoryLevelId: existingLevel.id,
            reasonCode: typedPayload.reasonCode,
            deltaQty: typedPayload.deltaQty,
            previousAvailable,
            newAvailable,
            idempotencyKey: typedPayload.idempotencyKey,
            correlationId,
            actorUserId: auth.userId,
          },
        });

        await tx.auditEvent.create({
          data: {
            entityType: "InventoryLevel",
            entityId: existingLevel.id,
            action: "inventory.adjust",
            actorUserId: auth.userId,
            correlationId,
            metadataJson: JSON.stringify({
              reasonCode: typedPayload.reasonCode,
              deltaQty: typedPayload.deltaQty,
              previousAvailable,
              newAvailable,
              idempotencyKey: typedPayload.idempotencyKey,
              note: typedPayload.note ?? null,
            }),
          },
        });

        return {
          adjustmentId: createdAdjustment.id,
          inventoryLevelId: existingLevel.id,
          previousAvailable,
          newAvailable,
          updatedVersion: typedPayload.expectedVersion + 1,
          processedAt: createdAdjustment.createdAt.toISOString(),
        } satisfies InventoryAdjustResponse;
      });

      return result;
    } catch (error: unknown) {
      if (error instanceof HttpException) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError
        && error.code === "P2002"
      ) {
        throw new HttpException(
          {
            code: "duplicate_idempotency_key",
            message: "Idempotency key has already been used",
          },
          HttpStatus.CONFLICT,
        );
      }

      throw new HttpException(
        {
          code: "internal_error",
          message: "Unable to process inventory adjustment",
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
