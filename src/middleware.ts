import { NextResponse } from "next/server";
import { auth } from "@root/auth"; // the real instance — providers, adapter, idle-timeout jwt/session callbacks

const publicRoutes = ["/", "/login", "/signup", "/admin/login", "/manifest.json", "/sw.js", "/icon-192.png", "/icon-512.png", "/offline"];
const authRoutes   = ["/login", "/signup"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn  = !!req.auth;
  const role        = (req.auth?.user as any)?.role as string | undefined;

  const pathname = nextUrl.pathname;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute   = authRoutes.includes(pathname);
  const isAdminRoute  = pathname.startsWith("/dashboard/admin");

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  if (!isPublicRoute && !isLoggedIn) {
    const response = NextResponse.redirect(new URL("/login", nextUrl));
    // Belt-and-suspenders: stop the browser/bfcache from serving a
    // stale authenticated page on back-navigation.
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  const response = NextResponse.next();
  if (!isPublicRoute) {
    // Protected pages shouldn't be cached — this is what typically
    // causes "logged out but back button still shows the dashboard."
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return response;
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icons/).*)"],
};
