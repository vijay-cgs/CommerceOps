import type {
  OrderView,
  PlaceOrderRequest,
  ProductListResponse,
  ProductView,
} from "@commerceops/types";

type ApiSuccessEnvelope<T> = { success: true; correlationId: string; data: T };
type ApiErrorEnvelope = {
  success: false;
  correlationId: string;
  error: { code: string; message: string };
};

export class StorefrontApiError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "StorefrontApiError";
    this.code = code;
  }
}

async function readEnvelope<T>(response: Response, fallback: string): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    ApiSuccessEnvelope<T> | ApiErrorEnvelope | null;

  if (!response.ok || !payload || !payload.success) {
    const error = payload && !payload.success ? payload.error : null;
    throw new StorefrontApiError(error?.code ?? "unknown_error", error?.message ?? fallback);
  }

  return payload.data;
}

export async function fetchProductsPage(page = 1, pageSize = 24): Promise<ProductListResponse> {
  const response = await fetch(`/api/products?page=${page}&pageSize=${pageSize}`, {
    cache: "no-store",
  });
  const data = await readEnvelope<ProductListResponse>(response, "Unable to load products");

  return data;
}

export async function fetchProducts(): Promise<ProductView[]> {
  const products: ProductView[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const data = await fetchProductsPage(page, 1000);
    products.push(...data.products);
    hasMore = data.hasMore;
    page += 1;
  }

  return products;
}

export async function fetchProduct(slug: string): Promise<ProductView> {
  const response = await fetch(`/api/products/${encodeURIComponent(slug)}`, {
    cache: "no-store",
  });

  return readEnvelope<ProductView>(response, "Unable to load product");
}

export async function submitOrder(request: PlaceOrderRequest): Promise<OrderView> {
  const response = await fetch("/api/orders", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
    cache: "no-store",
  });

  return readEnvelope<OrderView>(response, "Unable to place order");
}
