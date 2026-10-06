import { cookies } from "next/headers";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-cookies";

type SupabaseTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  user?: {
    id: string;
    email?: string;
  };
  error?: string;
  error_description?: string;
  msg?: string;
};

export async function POST(request: Request) {
  const supabaseUrl =
    process.env.SUPABASE_URL ??
    "https://xtcrhaqjajritihqofsl.supabase.co";

  const apiKey =
    process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!apiKey) {
    return Response.json(
      {
        message:
          "Falta SUPABASE_PUBLISHABLE_KEY en el frontend.",
      },
      { status: 500 }
    );
  }

  const body = (await request.json()) as {
    email?: string;
    password?: string;
  };

  if (!body.email || !body.password) {
    return Response.json(
      {
        message:
          "Email y contraseña son obligatorios.",
      },
      { status: 400 }
    );
  }

  const response = await fetch(
    `${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`,
    {
      method: "POST",
      headers: {
        apikey: apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: body.email,
        password: body.password,
      }),
      cache: "no-store",
    }
  );

  const data =
    (await response.json()) as SupabaseTokenResponse;

  if (
    !response.ok ||
    !data.access_token ||
    !data.refresh_token
  ) {
    return Response.json(
      {
        message:
          data.msg ??
          data.error_description ??
          "Credenciales incorrectas.",
      },
      { status: 401 }
    );
  }

  const cookieStore = await cookies();
  const secure =
    process.env.NODE_ENV === "production";

  cookieStore.set(
    ACCESS_TOKEN_COOKIE,
    data.access_token,
    {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: data.expires_in ?? 3600,
    }
  );

  cookieStore.set(
    REFRESH_TOKEN_COOKIE,
    data.refresh_token,
    {
      httpOnly: true,
      sameSite: "lax",
      secure,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    }
  );

  return Response.json({
    success: true,
    user: data.user ?? null,
  });
}
