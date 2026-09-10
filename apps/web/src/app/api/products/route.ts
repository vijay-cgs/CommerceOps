import { NextResponse } from "next/server";
import { API_BASE_URL } from "../../../lib/session";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  const upstream = await fetch(`${API_BASE_URL}/api/v1/products${query}`, {
    method: "GET",
    cache: "no-store",
  });

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
