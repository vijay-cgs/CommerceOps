export type UserRole = "admin" | "inventory_manager" | "read_only";

export type DevSeedUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export const DEV_SEED_USERS: DevSeedUser[] = [
  {
    id: "seed-admin-001",
    email: "admin@commerceops.local",
    name: "Store Admin",
    role: "admin",
  },
  {
    id: "seed-inventory-001",
    email: "inventory@commerceops.local",
    name: "Inventory Manager",
    role: "inventory_manager",
  },
  {
    id: "seed-readonly-001",
    email: "readonly@commerceops.local",
    name: "Read-only Ops",
    role: "read_only",
  },
];

export function findSeedUserById(userId: string): DevSeedUser | null {
  return DEV_SEED_USERS.find((user) => user.id === userId) ?? null;
}
