import {
  NextRequest,
  NextResponse,
} from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth-cookies";
import {
  isTokenExpiring,
  refreshSupabaseSession,
} from "@/lib/supabase-refresh";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/return",
  "/api",
];

function cookieOptions(
  maxAge: number
) {
  return {
    httpOnly: true,
    sameSite:
      "lax" as const,
    secure:
      process.env.NODE_ENV ===
      "production",
    path: "/",
    maxAge,
  };
}

export async function proxy(
  request: NextRequest
) {
  const { pathname } =
    request.nextUrl;

  const isPublicPath =
    PUBLIC_PATH_PREFIXES.some(
      (prefix) =>
        pathname === prefix ||
        pathname.startsWith(
          `${prefix}/`
        )
    );

  if (isPublicPath) {
    return NextResponse.next();
  }

  const accessToken =
    request.cookies.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  const refreshToken =
    request.cookies.get(
      REFRESH_TOKEN_COOKIE
    )?.value;

  if (
    accessToken &&
    !isTokenExpiring(
      accessToken
    )
  ) {
    return NextResponse.next();
  }

  if (!refreshToken) {
    const loginUrl =
      new URL(
        "/login",
        request.url
      );

    return NextResponse.redirect(
      loginUrl
    );
  }

  const refreshed =
    await refreshSupabaseSession(
      refreshToken
    );

  if (!refreshed) {
    const response =
      NextResponse.redirect(
        new URL(
          "/login",
          request.url
        )
      );

    response.cookies.delete(
      ACCESS_TOKEN_COOKIE
    );
    response.cookies.delete(
      REFRESH_TOKEN_COOKIE
    );

    return response;
  }

  const response =
    NextResponse.next();

  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    refreshed.accessToken,
    cookieOptions(
      refreshed.expiresIn
    )
  );

  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    refreshed.refreshToken,
    cookieOptions(
      60 * 60 * 24 * 30
    )
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
