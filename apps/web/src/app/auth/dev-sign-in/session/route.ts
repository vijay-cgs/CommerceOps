import { NextResponse } from "next/server";
import { DEV_AUTH_COOKIE_NAME } from "../../../../lib/auth";
import { findSeedUserById } from "../../../../lib/dev-seed-users";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");

  if (!userId) {
    return NextResponse.redirect(new URL("/auth/dev-sign-in", request.url));
  }

  const user = findSeedUserById(userId);

  if (!user) {
    return NextResponse.redirect(new URL("/auth/dev-sign-in", request.url));
  }

  const response = NextResponse.redirect(new URL("/inventory", request.url));
  response.cookies.set({
    name: DEV_AUTH_COOKIE_NAME,
    value: user.id,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
