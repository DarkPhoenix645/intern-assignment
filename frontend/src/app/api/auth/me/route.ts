import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const backendUrl =
    process.env.API_URL || "https://intern-assignment-api.onrender.com";
  const res = await fetch(`${backendUrl}/api/auth/me`, {
    method: "GET",
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
    credentials: "include",
  });
  const data = await res.json();
  return new NextResponse(JSON.stringify(data), {
    status: res.status,
    headers: { "Content-Type": "application/json" },
  });
}
