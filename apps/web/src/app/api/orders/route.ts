import { NextResponse } from "next/server";
import { getAuthContext } from "../../../lib/auth";
import { API_BASE_URL } from "../../../lib/session";

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      correlationId: "web-no-auth",
      error: { code: "unauthorized", message: "Sign in to continue" },
    },
    { status: 401 },
  );
}

export async function GET() {
  const auth = await getAuthContext();

  if (!auth) {
    return unauthorized();
  }

  const upstream = await fetch(`${API_BASE_URL}/api/v1/orders`, {
    method: "GET",
    headers: { authorization: `Bearer ${auth.token}` },
    cache: "no-store",
  });

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

export async function POST(request: Request) {
  const auth = await getAuthContext();

  if (!auth) {
    return unauthorized();
  }

  const upstream = await fetch(`${API_BASE_URL}/api/v1/orders`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${auth.token}`,
    },
    body: await request.text(),
    cache: "no-store",
  });

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
