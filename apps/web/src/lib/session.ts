import { NextResponse } from "next/server";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_SECONDS } from "./auth";

export const API_BASE_URL = process.env.COMMERCEOPS_API_URL ?? "http://localhost:3002";

export function setSessionCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse): void {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

type UpstreamAuthPayload = {
  data?: { user?: { id: string; email: string; name: string; role: string }; token?: string };
  error?: { code?: string; message?: string };
};

/**
 * Forwards a credential payload to the API and, on success, exchanges the
 * returned token for an httpOnly session cookie. The token itself is never
 * exposed to the browser.
 */
export async function proxyCredentialRequest(
  path: string,
  payload: unknown,
): Promise<NextResponse> {
  let upstream: Response;

  try {
    upstream = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: { code: "api_unreachable", message: "Unable to reach the authentication service" } },
      { status: 503 },
    );
  }

  const body = (await upstream.json().catch(() => null)) as UpstreamAuthPayload | null;

  if (!upstream.ok || !body?.data?.token || !body.data.user) {
    return NextResponse.json(
      {
        error: {
          code: body?.error?.code ?? "auth_failed",
          message: body?.error?.message ?? "Authentication failed",
        },
      },
      { status: upstream.status === 200 ? 500 : upstream.status },
    );
  }

  const response = NextResponse.json({ user: body.data.user });
  setSessionCookie(response, body.data.token);

  return response;
}
