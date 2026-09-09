import { HttpException, HttpStatus } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { prismaClient } from "../prisma/prisma.client";

export async function getOrCreateSku(
  code: string,
  client: Prisma.TransactionClient | typeof prismaClient = prismaClient,
) {
  const existing = await client.sku.findUnique({ where: { code } });

  if (existing?.isArchived) {
    throw new HttpException(
      { code: "sku_archived", message: "Archived SKUs cannot be linked to products" },
      HttpStatus.CONFLICT,
    );
  }

  return existing ?? client.sku.create({ data: { code } });
}
