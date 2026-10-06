import { NextRequest, NextResponse } from "next/server";

import { ACCESS_TOKEN_COOKIE } from "@/lib/auth-cookies";

const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/return",
  "/api",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isPublicPath =
    PUBLIC_PATH_PREFIXES.some(
      (prefix) =>
        pathname === prefix ||
        pathname.startsWith(`${prefix}/`)
    );

  if (isPublicPath) {
    return NextResponse.next();
  }

  const accessToken =
    request.cookies.get(
      ACCESS_TOKEN_COOKIE
    )?.value;

  if (!accessToken) {
    const loginUrl =
      new URL("/login", request.url);

    return NextResponse.redirect(
      loginUrl
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
