import { NextResponse } from "next/server";
import { proxyCredentialRequest } from "../../../../lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.email !== "string" || typeof body.password !== "string") {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "Email and password are required" } },
      { status: 400 },
    );
  }

  return proxyCredentialRequest("/api/v1/auth/login", {
    email: body.email,
    password: body.password,
  });
}
