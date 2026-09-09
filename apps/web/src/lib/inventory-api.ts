import type {
  InventoryAdjustRequest,
  InventoryAdjustResponse,
  InventoryAdjustmentHistoryResponse,
  InventoryContextResponse,
} from "@commerceops/types";

type ApiSuccessEnvelope<T> = {
  success: true;
  correlationId: string;
  data: T;
};

type ApiErrorEnvelope = {
  success: false;
  correlationId: string;
  error: {
    code: string;
    message: string;
  };
};

/** Preserves the API error code so callers can react to conflicts specifically. */
export class InventoryApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "InventoryApiError";
    this.code = code;
  }
}

export async function fetchInventoryContext(
  search = "",
  cursor = "",
): Promise<InventoryContextResponse> {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (cursor) params.set("cursor", cursor);
  const query = params.toString();
  const response = await fetch(`/api/inventory/context${query ? `?${query}` : ""}`, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as
    ApiSuccessEnvelope<InventoryContextResponse> | ApiErrorEnvelope;

  if (!response.ok || !payload.success) {
    throw new Error("Unable to load inventory context");
  }

  return payload.data;
}

export async function fetchInventoryHistory(): Promise<InventoryAdjustmentHistoryResponse> {
  const response = await fetch("/api/inventory/history", {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as
    ApiSuccessEnvelope<InventoryAdjustmentHistoryResponse> | ApiErrorEnvelope;

  if (!response.ok || !payload.success) {
    throw new Error("Unable to load inventory adjustment history");
  }

  return payload.data;
}

export async function submitInventoryAdjustment(
  request: InventoryAdjustRequest,
): Promise<InventoryAdjustResponse> {
  const response = await fetch("/api/inventory/adjust", {
    method: "POST",
    cache: "no-store",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = (await response.json()) as
    ApiSuccessEnvelope<InventoryAdjustResponse> | ApiErrorEnvelope;

  if (!response.ok || !payload.success) {
    if (!payload.success) {
      throw new InventoryApiError(
        payload.error.code ?? "unknown_error",
        payload.error.message || "Unable to submit inventory adjustment",
      );
    }

    throw new InventoryApiError("unknown_error", "Unable to submit inventory adjustment");
  }

  return payload.data;
}
