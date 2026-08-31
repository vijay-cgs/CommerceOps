import { NextResponse } from "next/server";
import { clearSessionCookie } from "../../../lib/session";

// POST only, so a cross-site GET cannot force a sign-out.
export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  clearSessionCookie(response);

  return response;
}
