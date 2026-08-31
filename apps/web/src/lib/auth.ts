import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import type { UserRole } from "@commerceops/types";

export const SESSION_COOKIE_NAME = "co_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

const ISSUER = "commerceops";
const AUDIENCE = "commerceops-web";

export type AuthContext = {
  userId: string;
  role: UserRole;
  displayName: string;
  email: string;
  token: string;
};

/** Auth fields that are safe to send to the browser. Never includes the token. */
export type SessionUser = Omit<AuthContext, "token">;

export function toSessionUser(auth: AuthContext): SessionUser {
  const { token: _token, ...user } = auth;
  return user;
}

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_JWT_SECRET must be set to a random string of at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  // Resolved outside the try so a misconfigured secret fails loudly instead of
  // silently rendering every visitor as signed out.
  const secret = getSecret();

  try {
    const { payload } = await jwtVerify(token, secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (!payload.sub || typeof payload.role !== "string") {
      return null;
    }

    return {
      userId: payload.sub,
      role: payload.role as UserRole,
      displayName: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      token,
    };
  } catch {
    return null;
  }
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const auth = await getAuthContext();
  return auth ? toSessionUser(auth) : null;
}
