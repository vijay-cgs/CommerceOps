import { HttpException, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { OrderView, PlaceOrderRequest } from "@commerceops/types";
import { prismaClient } from "../prisma/prisma.client";

export const SHIPPING_FLAT_CENTS = 1200;

export function calculateShippingCents(subtotalCents: number): number {
  return subtotalCents > 0 ? SHIPPING_FLAT_CENTS : 0;
}

/** Collapses repeated SKUs so the same variant cannot bypass per-line limits. */
export function mergeOrderLines(
  items: { sku: string; quantity: number }[],
): { sku: string; quantity: number }[] {
  const merged = new Map<string, number>();

  for (const item of items) {
    merged.set(item.sku, (merged.get(item.sku) ?? 0) + item.quantity);
  }

  return [...merged.entries()].map(([sku, quantity]) => ({ sku, quantity }));
}

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(Math.random() * 36 ** 4)
    .toString(36)
    .toUpperCase()
    .padStart(4, "0");

  return `CO-${stamp}-${random}`;
}

export async function placeOrder(
  request: PlaceOrderRequest,
  actor: { userId: string },
  correlationId: string,
): Promise<OrderView> {
  const lines = mergeOrderLines(request.items);

  try {
    return await prismaClient.$transaction(async (tx) => {
      const variants = await tx.productVariant.findMany({
        where: {
          sku: { in: lines.map((line) => line.sku) },
          isActive: true,
          product: { status: "active" },
        },
        include: { product: { select: { name: true } } },
      });

      const variantBySku = new Map(variants.map((variant) => [variant.sku, variant]));
      const missing = lines.filter((line) => !variantBySku.has(line.sku));

      if (missing.length > 0) {
        throw new HttpException(
          {
            code: "product_unavailable",
            message: "One or more items are no longer available",
            details: missing.map((line) => line.sku),
          },
          HttpStatus.BAD_REQUEST,
        );
      }

      let subtotalCents = 0;
      const itemRows: Prisma.OrderItemCreateManyOrderInput[] = [];

      for (const line of lines) {
        const variant = variantBySku.get(line.sku)!;

        // Price always comes from the catalog, never from the client payload.
        const lineTotalCents = variant.priceCents * line.quantity;
        subtotalCents += lineTotalCents;

        const level = await tx.inventoryLevel.findFirst({
          where: { sku: variant.sku },
          orderBy: { locationId: "asc" },
        });

        if (!level) {
          throw new HttpException(
            {
              code: "out_of_stock",
              message: `${variant.product.name} is out of stock`,
            },
            HttpStatus.CONFLICT,
          );
        }

        // The availableQty guard makes the decrement atomic, so concurrent
        // orders cannot oversell the same stock.
        const decremented = await tx.inventoryLevel.updateMany({
          where: { id: level.id, availableQty: { gte: line.quantity } },
          data: {
            availableQty: { decrement: line.quantity },
            expectedVersion: { increment: 1 },
          },
        });

        if (decremented.count !== 1) {
          throw new HttpException(
            {
              code: "insufficient_stock",
              message: `Only ${level.availableQty} of ${variant.product.name} remain in stock`,
            },
            HttpStatus.CONFLICT,
          );
        }

        itemRows.push({
          variantId: variant.id,
          sku: variant.sku,
          nameSnapshot: variant.product.name,
          optionSnapshot: variant.optionValue,
          unitPriceCents: variant.priceCents,
          quantity: line.quantity,
          lineTotalCents,
        });
      }

      const shippingCents = calculateShippingCents(subtotalCents);

      const order = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId: actor.userId,
          subtotalCents,
          shippingCents,
          totalCents: subtotalCents + shippingCents,
          shippingName: request.shippingName.trim(),
          shippingAddress: request.shippingAddress.trim(),
          shippingCity: request.shippingCity.trim(),
          shippingPostalCode: request.shippingPostalCode.trim(),
          idempotencyKey: request.idempotencyKey,
          correlationId,
          items: { createMany: { data: itemRows } },
        },
        include: { items: true },
      });

      await tx.auditEvent.create({
        data: {
          entityType: "Order",
          entityId: order.id,
          action: "order.placed",
          actorUserId: actor.userId,
          correlationId,
          metadataJson: JSON.stringify({
            orderNumber: order.orderNumber,
            totalCents: order.totalCents,
            lines: itemRows.map((item) => ({ sku: item.sku, quantity: item.quantity })),
          }),
        },
      });

      return toOrderView(order);
    });
  } catch (error) {
    if (error instanceof HttpException) {
      throw error;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existing = await prismaClient.order.findUnique({
        where: { idempotencyKey: request.idempotencyKey },
        include: { items: true },
      });

      // A retry of an order that already succeeded returns the original order
      // rather than charging the customer twice.
      if (existing) {
        return toOrderView(existing);
      }
    }

    throw new HttpException(
      { code: "internal_error", message: "Unable to place order" },
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }
}

type OrderWithItems = {
  id: string;
  orderNumber: string;
  status: string;
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: Date;
  items: {
    sku: string;
    nameSnapshot: string;
    optionSnapshot: string | null;
    unitPriceCents: number;
    quantity: number;
    lineTotalCents: number;
  }[];
};

export function toOrderView(order: OrderWithItems): OrderView {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status as OrderView["status"],
    subtotalCents: order.subtotalCents,
    shippingCents: order.shippingCents,
    totalCents: order.totalCents,
    createdAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      sku: item.sku,
      name: item.nameSnapshot,
      optionValue: item.optionSnapshot,
      unitPriceCents: item.unitPriceCents,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
    })),
  };
}

export async function listOrdersForUser(userId: string) {
  const orders = await prismaClient.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 20,
    include: { items: true },
  });

  return orders.map(toOrderView);
}

export async function getOrderForUser(
  userId: string,
  orderNumber: string,
): Promise<OrderView | null> {
  const order = await prismaClient.order.findFirst({
    where: { userId, orderNumber },
    include: { items: true },
  });

  return order ? toOrderView(order) : null;
}
