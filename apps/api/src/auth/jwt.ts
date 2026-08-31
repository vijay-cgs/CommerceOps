import { SignJWT, jwtVerify } from "jose";

export type UserRole = "admin" | "inventory_manager" | "read_only" | "customer";

export type SessionClaims = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
};

const ISSUER = "commerceops";
const AUDIENCE = "commerceops-web";
const TOKEN_TTL = "7d";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error("AUTH_JWT_SECRET must be set to a random string of at least 32 characters");
  }

  return new TextEncoder().encode(secret);
}

export async function signSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT({ email: claims.email, name: claims.name, role: claims.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifySessionToken(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    if (!payload.sub || typeof payload.role !== "string") {
      return null;
    }

    return {
      sub: payload.sub,
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role as UserRole,
    };
  } catch {
    return null;
  }
}
