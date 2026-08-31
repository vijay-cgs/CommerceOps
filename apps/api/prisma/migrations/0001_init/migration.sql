CREATE TABLE "InventoryLevel" (
  "id" TEXT PRIMARY KEY,
  "sku" TEXT NOT NULL,
  "locationId" TEXT NOT NULL,
  "availableQty" INTEGER NOT NULL DEFAULT 0,
  "reservedQty" INTEGER NOT NULL DEFAULT 0,
  "incomingQty" INTEGER NOT NULL DEFAULT 0,
  "expectedVersion" INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "InventoryLevel_sku_locationId_key"
ON "InventoryLevel" ("sku", "locationId");

CREATE INDEX "InventoryLevel_locationId_idx"
ON "InventoryLevel" ("locationId");

CREATE TABLE "InventoryAdjustment" (
  "id" TEXT PRIMARY KEY,
  "inventoryLevelId" TEXT NOT NULL,
  "reasonCode" TEXT NOT NULL,
  "deltaQty" INTEGER NOT NULL,
  "previousAvailable" INTEGER NOT NULL,
  "newAvailable" INTEGER NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventoryAdjustment_inventoryLevelId_fkey"
    FOREIGN KEY ("inventoryLevelId") REFERENCES "InventoryLevel" ("id")
    ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "InventoryAdjustment_idempotencyKey_key"
ON "InventoryAdjustment" ("idempotencyKey");

CREATE INDEX "InventoryAdjustment_inventoryLevelId_idx"
ON "InventoryAdjustment" ("inventoryLevelId");

CREATE TABLE "AuditEvent" (
  "id" TEXT PRIMARY KEY,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "actorUserId" TEXT NOT NULL,
  "correlationId" TEXT NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadataJson" TEXT
);

CREATE INDEX "AuditEvent_entityType_entityId_idx"
ON "AuditEvent" ("entityType", "entityId");
