import { NextResponse } from "next/server";
import { API_BASE_URL } from "../../../lib/session";

export async function GET() {
  const upstream = await fetch(`${API_BASE_URL}/api/v1/products`, {
    method: "GET",
    cache: "no-store",
  });

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
