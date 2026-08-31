import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.AUTH_JWT_SECRET = "test-secret-value-that-is-long-enough-1234567890";
});

describe("session tokens", () => {
  it("round-trips claims through sign and verify", async () => {
    const { signSessionToken, verifySessionToken } = await import("../src/auth/jwt");

    const token = await signSessionToken({
      sub: "user-1",
      email: "admin@commerceops.local",
      name: "Store Admin",
      role: "admin",
    });

    const claims = await verifySessionToken(token);

    expect(claims).toEqual({
      sub: "user-1",
      email: "admin@commerceops.local",
      name: "Store Admin",
      role: "admin",
    });
  });

  it("rejects a tampered token", async () => {
    const { signSessionToken, verifySessionToken } = await import("../src/auth/jwt");

    const token = await signSessionToken({
      sub: "user-1",
      email: "readonly@commerceops.local",
      name: "Read-only Ops",
      role: "read_only",
    });

    const [header, payload, signature] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ sub: "user-1", role: "admin" })).toString(
      "base64url",
    );

    expect(await verifySessionToken(`${header}.${forgedPayload}.${signature}`)).toBeNull();
  });

  it("rejects a malformed token", async () => {
    const { verifySessionToken } = await import("../src/auth/jwt");

    expect(await verifySessionToken("not-a-jwt")).toBeNull();
  });
});

describe("password strength", () => {
  it.each([
    ["short1A", "Password must be at least 10 characters long"],
    ["alllowercase1", "Password must include both uppercase and lowercase letters"],
    ["NoDigitsHere", "Password must include at least one number"],
  ])("rejects %s", async (password, expected) => {
    const { assessPasswordStrength } = await import("../src/auth/auth.service");

    expect(assessPasswordStrength(password)).toBe(expected);
  });

  it("accepts a strong password", async () => {
    const { assessPasswordStrength } = await import("../src/auth/auth.service");

    expect(assessPasswordStrength("Shopper2026x")).toBeNull();
  });
});
