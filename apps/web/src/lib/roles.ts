import type { UserRole } from "@commerceops/types";

const INVENTORY_ROLES: UserRole[] = ["admin", "inventory_manager", "read_only"];

export function canAccessInventory(role: UserRole): boolean {
  return INVENTORY_ROLES.includes(role);
}

export function canManageProducts(role: UserRole): boolean {
  return role === "admin" || role === "inventory_manager";
}

export function formatRole(role: UserRole): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "inventory_manager":
      return "Inventory Manager";
    case "read_only":
      return "Read-only Ops";
    default:
      return "Customer";
  }
}
