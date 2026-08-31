export type EntityId = string;

export type UserRole = "admin" | "inventory_manager" | "read_only" | "customer";

export type InventoryLevelView = {
  id: string;
  sku: string;
  locationId: string;
  availableQty: number;
  reservedQty: number;
  incomingQty: number;
  expectedVersion: number;
  updatedAt: string;
};

export type InventoryContextResponse = {
  viewer: {
    userId: string;
    role: UserRole;
    canAdjust: boolean;
  };
  levels: InventoryLevelView[];
};

export type InventoryAdjustRequest = {
  inventoryLevelId: string;
  reasonCode: string;
  deltaQty: number;
  expectedVersion: number;
  idempotencyKey: string;
  note?: string;
};

export type InventoryAdjustResponse = {
  adjustmentId: string;
  inventoryLevelId: string;
  previousAvailable: number;
  newAvailable: number;
  updatedVersion: number;
  processedAt: string;
};

export type InventoryAdjustmentHistoryItem = {
  id: string;
  inventoryLevelId: string;
  sku: string;
  locationId: string;
  reasonCode: string;
  deltaQty: number;
  previousAvailable: number;
  newAvailable: number;
  actorUserId: string;
  createdAt: string;
};

export type InventoryAdjustmentHistoryResponse = {
  items: InventoryAdjustmentHistoryItem[];
};
