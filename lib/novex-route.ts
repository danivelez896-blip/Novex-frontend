import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

export async function novexRouteFetch(
  path: string,
  init?: RequestInit
) {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  if (!token) {
    return Response.json(
      {
        message:
          "Sesión no autenticada.",
      },
      { status: 401 }
    );
  }

  const headers = new Headers(
    init?.headers
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  return fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api${path}`,
    {
      ...init,
      headers,
      cache: "no-store",
    }
  );
}
