-- Introduces ProductVariant and moves SKU/price off Product.
-- Written by hand so existing products and order history survive: each product
-- gains one default variant, and order items are re-pointed at that variant by
-- matching the SKU they already recorded.

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('draft', 'active', 'archived');

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "optionValue" TEXT,
    "priceCents" INTEGER NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_sku_key" ON "ProductVariant"("sku");

-- CreateIndex
CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: one default variant per existing product, carrying its SKU and price.
INSERT INTO "ProductVariant" ("id", "productId", "sku", "optionValue", "priceCents", "position", "isActive", "createdAt", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text || "id"),
    "id",
    "sku",
    NULL,
    "priceCents",
    0,
    "isActive",
    "createdAt",
    "updatedAt"
FROM "Product";

-- AlterTable: product status replaces the isActive flag.
ALTER TABLE "Product" ADD COLUMN "optionName" TEXT;
ALTER TABLE "Product" ADD COLUMN "status" "ProductStatus" NOT NULL DEFAULT 'draft';
UPDATE "Product" SET "status" = CASE WHEN "isActive" THEN 'active'::"ProductStatus" ELSE 'archived'::"ProductStatus" END;

-- AlterTable: order items point at variants instead of products.
ALTER TABLE "OrderItem" ADD COLUMN "optionSnapshot" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;

UPDATE "OrderItem" oi
SET "variantId" = pv."id"
FROM "ProductVariant" pv
WHERE pv."sku" = oi."sku";

-- An order line whose SKU no longer resolves would violate the new foreign key,
-- so fail loudly rather than silently discarding order history.
DO $$
DECLARE orphaned INTEGER;
BEGIN
    SELECT COUNT(*) INTO orphaned FROM "OrderItem" WHERE "variantId" IS NULL;
    IF orphaned > 0 THEN
        RAISE EXCEPTION 'Cannot migrate: % order item(s) have no matching variant SKU', orphaned;
    END IF;
END $$;

ALTER TABLE "OrderItem" ALTER COLUMN "variantId" SET NOT NULL;

-- DropForeignKey
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- DropColumn, now that the data has been carried across.
ALTER TABLE "OrderItem" DROP COLUMN "productId";

-- DropIndex
DROP INDEX "Product_isActive_idx";
DROP INDEX "Product_sku_key";

ALTER TABLE "Product" DROP COLUMN "isActive";
ALTER TABLE "Product" DROP COLUMN "priceCents";
ALTER TABLE "Product" DROP COLUMN "sku";

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");
