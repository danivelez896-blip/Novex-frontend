import { cookies } from "next/headers";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";
import { ACTIVE_STORE_COOKIE } from "@/lib/store-context";

const NOVEX_API_URL =
  process.env.NOVEX_API_URL ??
  "https://novex-production-f614.up.railway.app";

export async function POST(
  request: Request
) {
  const body = (await request.json()) as {
    storeId?: number;
  };

  if (
    !body.storeId ||
    !Number.isInteger(body.storeId)
  ) {
    return Response.json(
      {
        message:
          "storeId no válido.",
      },
      { status: 400 }
    );
  }

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

  const response = await fetch(
    `${NOVEX_API_URL.replace(/\/$/, "")}/api/stores`,
    {
      headers: {
        Authorization:
          `Bearer ${token}`,
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    return Response.json(
      {
        message:
          "No se pudieron comprobar las tiendas.",
      },
      { status: response.status }
    );
  }

  const stores =
    (await response.json()) as {
      id: number;
    }[];

  const allowed =
    stores.some(
      (store) =>
        store.id === body.storeId
    );

  if (!allowed) {
    return Response.json(
      {
        message:
          "No tienes acceso a esta tienda.",
      },
      { status: 403 }
    );
  }

  cookieStore.set(
    ACTIVE_STORE_COOKIE,
    String(body.storeId),
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

  return Response.json({
    success: true,
    storeId: body.storeId,
  });
}
