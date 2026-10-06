import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-cookies";
import {
  isTokenExpiring,
  refreshSupabaseSession,
} from "@/lib/supabase-refresh";

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

async function getRouteAccessToken() {
  const cookieStore =
    await cookies();

  const accessToken =
    cookieStore.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  if (
    accessToken &&
    !isTokenExpiring(
      accessToken
    )
  ) {
    return accessToken;
  }

  const refreshToken =
    cookieStore.get(
      REFRESH_TOKEN_COOKIE
    )?.value;

  if (!refreshToken) {
    return null;
  }

  const refreshed =
    await refreshSupabaseSession(
      refreshToken
    );

  if (!refreshed) {
    cookieStore.delete(
      ACCESS_TOKEN_COOKIE
    );
    cookieStore.delete(
      REFRESH_TOKEN_COOKIE
    );
    return null;
  }

  const secure =
    process.env.NODE_ENV ===
    "production";

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    refreshed.accessToken,
    {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge:
        refreshed.expiresIn,
    }
  );

  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    refreshed.refreshToken,
    {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge:
        60 * 60 * 24 * 30,
    }
  );

  return refreshed.accessToken;
}

export async function novexRouteFetch(
  path: string,
  init?: RequestInit
) {
  const token =
    await getRouteAccessToken();

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
