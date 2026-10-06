import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";
import { ACTIVE_STORE_COOKIE } from "@/lib/store-context";

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

  const baseUrl =
    NOVEX_API_URL.replace(/\/$/, "");

  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  const [
    meResponse,
    storesResponse,
  ] = await Promise.all([
    fetch(
      `${baseUrl}/api/auth/me`,
      {
        headers,
        cache: "no-store",
      }
    ),
    fetch(
      `${baseUrl}/api/stores`,
      {
        headers,
        cache: "no-store",
      }
    ),
  ]);

  if (!meResponse.ok) {
    return Response.json(
      {
        authenticated: false,
      },
      { status: 401 }
    );
  }

  const data =
    await meResponse.json();

  const stores =
    storesResponse.ok
      ? await storesResponse.json()
      : [];

  const requestedStoreId =
    Number(
      cookieStore.get(
        ACTIVE_STORE_COOKIE
      )?.value
    );

  const activeStore =
    stores.find(
      (store: { id: number }) =>
        store.id === requestedStoreId
    ) ??
    stores[0] ??
    null;

  if (
    activeStore &&
    activeStore.id !==
      requestedStoreId
  ) {
    cookieStore.set(
      ACTIVE_STORE_COOKIE,
      String(activeStore.id),
      {
        httpOnly: true,
        sameSite: "lax",
        secure:
          process.env.NODE_ENV ===
          "production",
        path: "/",
        maxAge:
          60 * 60 * 24 * 30,
      }
    );
  }

  return Response.json({
    authenticated: true,
    ...data,
    stores,
    activeStoreId:
      activeStore?.id ?? null,
  });
}
