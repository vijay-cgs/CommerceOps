import { NextResponse } from "next/server";
import { DEV_AUTH_COOKIE_NAME } from "../../../lib/auth";

export async function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set({
    name: DEV_AUTH_COOKIE_NAME,
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
