import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../../lib/auth";
import { API_BASE_URL } from "../../../../../lib/session";

async function forward(request: Request, id: string, method: string, hasBody: boolean) {
  const auth = await getAuthContext();

  if (!auth) {
    return NextResponse.json(
      {
        success: false,
        correlationId: "web-no-auth",
        error: { code: "unauthorized", message: "Sign in to continue" },
      },
      { status: 401 },
    );
  }

  const upstream = await fetch(`${API_BASE_URL}/api/v1/admin/products/${id}`, {
    method,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${auth.token}`,
    },
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return forward(request, id, "PATCH", true);
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  return forward(request, id, "DELETE", false);
}
