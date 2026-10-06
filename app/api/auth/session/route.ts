import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

export async function GET() {
  const cookieStore = await cookies();
  const accessToken =
    cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;

  if (!accessToken) {
    return Response.json(
      {
        authenticated: false,
      },
      { status: 401 }
    );
  }

  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return Response.json(
      {
        authenticated: false,
      },
      { status: 401 }
    );
  }

  const data = await response.json();

  return Response.json({
    authenticated: true,
    ...data,
  });
}
