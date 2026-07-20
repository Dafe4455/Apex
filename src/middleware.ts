import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { INACTIVITY_LIMIT_SECONDS } from "@/lib/session-config";

const publicRoutes = ["/", "/login", "/signup", "/admin/login", "/manifest.json", "/sw.js", "/icon-192.png", "/icon-512.png", "/offline"];
const authRoutes = ["/login", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;

  const now = Math.floor(Date.now() / 1000);
  const lastActive = (session as any)?.lastActive as number | undefined;
  const isExpired = !!lastActive && (now - lastActive > INACTIVITY_LIMIT_SECONDS);

  const isLoggedIn = !!session?.user && !isExpired;
  const role = (session?.user as any)?.role as string | undefined;

  const pathname = nextUrl.pathname;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isPublicRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    if (isExpired) {
      loginUrl.searchParams.set("expired", "true");
    }
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  const response = NextResponse.next();
  if (!isPublicRoute) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return response;
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icons/).*)"],
};
