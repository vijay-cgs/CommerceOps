CREATE TABLE "ProductImage" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SkuImage" (
    "id" TEXT NOT NULL,
    "skuId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "altText" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SkuImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductImage_productId_position_idx" ON "ProductImage"("productId", "position");
CREATE INDEX "SkuImage_skuId_position_idx" ON "SkuImage"("skuId", "position");
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SkuImage" ADD CONSTRAINT "SkuImage_skuId_fkey" FOREIGN KEY ("skuId") REFERENCES "Sku"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "ProductImage" ("id", "productId", "url", "position", "isPrimary")
SELECT md5(random()::text || clock_timestamp()::text || "id"), "id", "imageUrl", 0, true
FROM "Product" WHERE "imageUrl" IS NOT NULL AND length(trim("imageUrl")) > 0;

INSERT INTO "SkuImage" ("id", "skuId", "url", "position", "isPrimary")
SELECT md5(random()::text || clock_timestamp()::text || "id"), "id", "imageUrl", 0, true
FROM "Sku" WHERE "imageUrl" IS NOT NULL AND length(trim("imageUrl")) > 0;