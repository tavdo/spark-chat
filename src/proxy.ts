import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE_NAME } from "@/lib/constants";

const PUBLIC_PREFIXES = ["/", "/login", "/register", "/admin/login"];

function isPublic(pathname: string) {
  if (PUBLIC_PREFIXES.includes(pathname)) return true;
  if (pathname.startsWith("/api/auth/login")) return true;
  if (pathname.startsWith("/api/auth/register")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname.startsWith("/favicon")) return true;
  return false;
}

export async function proxy(req: Request) {
  const url = new URL(req.url);
  const { pathname } = url;

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const token = req.headers
    .get("cookie")
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!token) {
    const login = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(login, url));
  }

  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(decodeURIComponent(token), secret);
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      if (payload.role !== "ADMIN") {
        return NextResponse.redirect(new URL("/", url));
      }
    }
    return NextResponse.next();
  } catch {
    const login = pathname.startsWith("/admin") ? "/admin/login" : "/login";
    return NextResponse.redirect(new URL(login, url));
  }
}

export const config = {
  matcher: [
    "/chat",
    "/chat/:path*",
    "/profile",
    "/profile/:path*",
    "/pending",
    "/pending/:path*",
    "/banned",
    "/banned/:path*",
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/profile/:path*",
    "/api/upload/:path*",
    "/api/chat/:path*",
    "/api/verification/:path*",
    "/api/giphy/:path*",
    "/api/media/:path*",
    "/api/auth/me",
    "/api/auth/logout",
  ],
};
