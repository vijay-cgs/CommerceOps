import { NextResponse } from "next/server";
import { proxyCredentialRequest } from "../../../../lib/session";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.name !== "string" ||
    typeof body.email !== "string" ||
    typeof body.password !== "string"
  ) {
    return NextResponse.json(
      { error: { code: "invalid_request", message: "Name, email and password are required" } },
      { status: 400 },
    );
  }

  // Role is intentionally not accepted from the client; the API always creates customers.
  return proxyCredentialRequest("/api/v1/auth/register", {
    name: body.name,
    email: body.email,
    password: body.password,
  });
}
