export type EntityId = string;

export type UserRole = "admin" | "inventory_manager" | "read_only";

export type DevSeedUser = {
	id: string;
	email: string;
	name: string;
	role: UserRole;
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
