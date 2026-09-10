import type { ProductListResponse, ProductUpsertRequest, ProductView } from "@commerceops/types";
import { StorefrontApiError } from "./catalog-api";

type ApiSuccessEnvelope<T> = { success: true; correlationId: string; data: T };
type ApiErrorEnvelope = {
  success: false;
  correlationId: string;
  error: { code: string; message: string; details?: unknown };
};

async function readEnvelope<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    ApiSuccessEnvelope<T> | ApiErrorEnvelope | null;

  if (!response.ok || !payload || !payload.success) {
    const error = payload && !payload.success ? payload.error : null;
    const detail = Array.isArray(error?.details) ? ` (${error.details.join(", ")})` : "";

    throw new StorefrontApiError(
      error?.code ?? "unknown_error",
      `${error?.message ?? fallback}${detail}`,
    );
  }

  return payload.data;
}

export async function fetchAdminProducts(
  search: string,
  page = 1,
  pageSize = 25,
): Promise<ProductListResponse> {
  const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
  if (search) params.set("search", search);
  const response = await fetch(`/api/admin/products?${params}`, { cache: "no-store" });
  const data = await readEnvelope<ProductListResponse>(response, "Unable to load products");

  return data;
}

export async function fetchAdminProduct(id: string): Promise<ProductView> {
  const response = await fetch(`/api/admin/products/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });

  return readEnvelope<ProductView>(response, "Unable to load product");
}

export async function createAdminProduct(payload: ProductUpsertRequest): Promise<ProductView> {
  const response = await fetch("/api/admin/products", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readEnvelope<ProductView>(response, "Unable to create product");
}

export async function updateAdminProduct(
  id: string,
  payload: ProductUpsertRequest,
): Promise<ProductView> {
  const response = await fetch(`/api/admin/products/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  return readEnvelope<ProductView>(response, "Unable to save product");
}

export async function archiveAdminProduct(id: string): Promise<ProductView> {
  const response = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });

  return readEnvelope<ProductView>(response, "Unable to archive product");
}
