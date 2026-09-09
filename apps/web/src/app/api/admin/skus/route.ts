import { NextResponse } from "next/server";
import { getAuthContext } from "../../../../lib/auth";
import { API_BASE_URL } from "../../../../lib/session";

async function forward(request: Request, path: string, method: string, hasBody: boolean) {
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

  const upstream = await fetch(`${API_BASE_URL}/api/v1/admin/skus${path}`, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${auth.token}` },
    body: hasBody ? await request.text() : undefined,
    cache: "no-store",
  });

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET(request: Request) {
  const search = new URL(request.url).searchParams.get("search") ?? "";
  return forward(request, search ? `?search=${encodeURIComponent(search)}` : "", "GET", false);
}

export async function POST(request: Request) {
  return forward(request, "", "POST", true);
}
