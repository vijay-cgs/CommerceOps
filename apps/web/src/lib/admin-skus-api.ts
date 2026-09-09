import type { AdminSkuListResponse, AdminSkuView, SkuUpsertRequest } from "@commerceops/types";
import { StorefrontApiError } from "./catalog-api";

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

async function read<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as Envelope<T> | null;
  if (!response.ok || !payload || !payload.success) {
    throw new StorefrontApiError(
      payload && !payload.success ? payload.error.code : "unknown_error",
      payload && !payload.success ? payload.error.message : fallback,
    );
  }
  return payload.data;
}

export async function fetchAdminSkus(search: string): Promise<AdminSkuView[]> {
  const query = search ? `?search=${encodeURIComponent(search)}` : "";
  const response = await fetch(`/api/admin/skus${query}`, { cache: "no-store" });
  return (await read<AdminSkuListResponse>(response, "Unable to load SKUs")).skus;
}

export async function createAdminSku(payload: SkuUpsertRequest): Promise<AdminSkuView> {
  const response = await fetch("/api/admin/skus", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return read(response, "Unable to create SKU");
}

export async function updateAdminSku(id: string, payload: SkuUpsertRequest): Promise<AdminSkuView> {
  const response = await fetch(`/api/admin/skus/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  return read(response, "Unable to update SKU");
}

export async function archiveAdminSku(id: string): Promise<AdminSkuView> {
  const response = await fetch(`/api/admin/skus/${id}`, { method: "DELETE" });
  return read(response, "Unable to archive SKU");
}
