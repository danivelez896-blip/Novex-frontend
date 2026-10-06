import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";
import { ACTIVE_STORE_COOKIE } from "@/lib/store-context";

export const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

export async function getNovexAccessToken() {
  const cookieStore = await cookies();
  const token =
    cookieStore.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  if (!token) {
    redirect("/login");
  }

  return token;
}

export async function getActiveStoreId() {
  const cookieStore = await cookies();
  const value =
    cookieStore.get(
      ACTIVE_STORE_COOKIE
    )?.value;

  const storeId = Number(value);

  return Number.isInteger(storeId) &&
    storeId > 0
    ? storeId
    : null;
}

export async function novexFetch(
  path: string,
  init?: RequestInit
) {
  const token =
    await getNovexAccessToken();

  const headers = new Headers(
    init?.headers
  );

  headers.set(
    "Authorization",
    `Bearer ${token}`
  );

  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api${path}`,
    {
      ...init,
      headers,
      cache:
        init?.cache ?? "no-store",
    }
  );

  if (response.status === 401) {
    redirect("/login");
  }

  return response;
}
