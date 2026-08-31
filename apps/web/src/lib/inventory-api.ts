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

export async function fetchInventoryContext(): Promise<InventoryContextResponse> {
  const response = await fetch("/api/inventory/context", {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | ApiSuccessEnvelope<InventoryContextResponse>
    | ApiErrorEnvelope;

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
    | ApiSuccessEnvelope<InventoryAdjustmentHistoryResponse>
    | ApiErrorEnvelope;

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
    | ApiSuccessEnvelope<InventoryAdjustResponse>
    | ApiErrorEnvelope;

  if (!response.ok || !payload.success) {
    if (!payload.success && payload.error.message) {
      throw new Error(payload.error.message);
    }

    throw new Error("Unable to submit inventory adjustment");
  }

  return payload.data;
}
