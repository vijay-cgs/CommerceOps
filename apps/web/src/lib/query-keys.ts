export const queryKeys = {
  inventoryContext: (search = "", cursor = "") => ["inventory", "context", search, cursor] as const,
  inventoryHistory: ["inventory", "history"] as const,
  products: ["catalog", "products"] as const,
  adminProducts: ["admin", "products"] as const,
};
