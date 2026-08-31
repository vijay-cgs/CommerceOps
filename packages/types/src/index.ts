export type EntityId = string;

export type UserRole = "admin" | "inventory_manager" | "read_only" | "customer";

export type ProductView = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  priceCents: number;
  tag: string;
  category: string;
  accent: string;
  features: string[];
};

export type ProductListResponse = {
  products: ProductView[];
};

export type OrderLineInput = {
  slug: string;
  quantity: number;
};

export type PlaceOrderRequest = {
  items: OrderLineInput[];
  shippingName: string;
  shippingAddress: string;
  shippingCity: string;
  shippingPostalCode: string;
  idempotencyKey: string;
};

export type OrderItemView = {
  sku: string;
  name: string;
  unitPriceCents: number;
  quantity: number;
  lineTotalCents: number;
};

export type OrderView = {
  id: string;
  orderNumber: string;
  status: "confirmed" | "cancelled";
  subtotalCents: number;
  shippingCents: number;
  totalCents: number;
  createdAt: string;
  items: OrderItemView[];
};

export type OrderListResponse = {
  orders: OrderView[];
};

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
