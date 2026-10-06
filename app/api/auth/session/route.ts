import { cookies } from "next/headers";

import { ACTIVE_STORE_COOKIE } from "@/lib/store-context";
import { novexRouteFetch } from "@/lib/novex-route";

export async function GET() {
  const cookieStore =
    await cookies();

  const [
    meResponse,
    storesResponse,
  ] = await Promise.all([
    novexRouteFetch(
      "/auth/me"
    ),
    novexRouteFetch(
      "/stores"
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

  const activeStoreChanged =
    Boolean(
      activeStore &&
      activeStore.id !==
        requestedStoreId
    );

  if (activeStoreChanged) {
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
    activeStoreChanged,
  });
}
