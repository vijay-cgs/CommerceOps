-- Introduce globally unique SKU identities while keeping product-specific pricing and options.

CREATE TABLE "Sku" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Sku_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sku_code_key" ON "Sku"("code");

ALTER TABLE "ProductVariant" ADD COLUMN "skuId" TEXT;

INSERT INTO "Sku" ("id", "code", "createdAt", "updatedAt")
SELECT
    md5(random()::text || clock_timestamp()::text || "sku"),
    "sku",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "ProductVariant"
GROUP BY "sku";

UPDATE "ProductVariant" pv
SET "skuId" = s."id"
FROM "Sku" s
WHERE s."code" = pv."sku";

DO $$
DECLARE missing INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing FROM "ProductVariant" WHERE "skuId" IS NULL;
    IF missing > 0 THEN
        RAISE EXCEPTION 'Cannot migrate: % product variant(s) have no global SKU', missing;
    END IF;
END $$;

ALTER TABLE "ProductVariant" ALTER COLUMN "skuId" SET NOT NULL;
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
DROP INDEX "ProductVariant_sku_key";
CREATE UNIQUE INDEX "ProductVariant_productId_skuId_key" ON "ProductVariant"("productId", "skuId");
CREATE INDEX "ProductVariant_skuId_idx" ON "ProductVariant"("skuId");
