import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/auth";

const API_BASE_URL = process.env.COMMERCEOPS_API_URL ?? "http://localhost:3002";

export async function POST(request: Request) {
  const auth = await getAuthContext();

  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        correlationId: "web-no-auth",
        error: {
          code: "unauthorized",
          message: "Authentication required",
        },
      },
      { status: 401 },
    );
  }

  const payload = await request.text();

  const upstream = await fetch(`${API_BASE_URL}/api/v1/inventory/adjust`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-dev-user-id": auth.userId,
    },
    body: payload,
    cache: "no-store",
  });

  const body = await upstream.text();

  return new NextResponse(body, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
    },
  });
}
