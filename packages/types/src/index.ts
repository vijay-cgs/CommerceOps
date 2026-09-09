export type EntityId = string;

export type UserRole = "admin" | "inventory_manager" | "read_only" | "customer";

export type ProductStatus = "draft" | "active" | "archived";

export type ProductVariantView = {
  id: string;
  productId: string;
  sku: string;
  /** Null for the default variant of a single-variant product. */
  optionValue: string | null;
  priceCents: number;
  isActive: boolean;
  availableQty: number;
};

export type ProductView = {
  id: string;
  slug: string;
  name: string;
  description: string;
  tag: string;
  category: string;
  accent: string;
  features: string[];
  status: ProductStatus;
  /** Label for the variant axis, e.g. "Size". Null when there is one variant. */
  optionName: string | null;
  variants: ProductVariantView[];
};

export type ProductListResponse = {
  products: ProductView[];
};

export type AdminSkuView = {
  id: string;
  sku: string;
  optionValue: string | null;
  priceCents: number;
  isActive: boolean;
  isArchived: boolean;
  productId: string;
  productName: string;
  productSlug: string;
  availableQty: number;
};

export type SkuUpsertRequest = {
  sku: string;
  productId: string;
  optionValue?: string | null;
  priceCents: number;
  isActive?: boolean;
};

export type AdminSkuListResponse = {
  skus: AdminSkuView[];
};

export type ProductVariantInput = {
  id?: string;
  sku: string;
  optionValue?: string | null;
  priceCents: number;
  isActive?: boolean;
};

export type ProductUpsertRequest = {
  slug: string;
  name: string;
  description: string;
  tag: string;
  category: string;
  accent: string;
  features: string[];
  status: ProductStatus;
  optionName?: string | null;
  variants: ProductVariantInput[];
};

export type OrderLineInput = {
  productId: string;
  sku: string;
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
  optionValue: string | null;
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
  hasMore: boolean;
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
