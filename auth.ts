import { NextResponse } from "next/server";
import { auth } from "@root/auth";

const publicRoutes = ["/", "/login", "/signup", "/admin/login", "/manifest.json", "/sw.js", "/icon-192.png", "/icon-512.png", "/offline"];
const authRoutes = ["/login", "/signup"];

const INACTIVITY_LIMIT_SECONDS = 60 * 10;

export default auth((req) => {
  const { nextUrl } = req;
  const session = req.auth;
  
  const now = Math.floor(Date.now() / 1000);
  const lastActive = (session as any)?.lastActive as number | undefined;
  const isExpired = !!lastActive && (now - lastActive > INACTIVITY_LIMIT_SECONDS);
  
  // Session is valid only if user exists AND not expired
  const isLoggedIn = !!session?.user && !isExpired;
  const role = (session?.user as any)?.role as string | undefined;

  const pathname = nextUrl.pathname;

  const isPublicRoute = publicRoutes.includes(pathname);
  const isAuthRoute = authRoutes.includes(pathname);
  const isAdminRoute = pathname.startsWith("/dashboard/admin");

  // Logged-in users hitting auth pages → redirect to dashboard
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Unauthenticated or expired users hitting protected routes → redirect to login
  if (!isPublicRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl);
    if (isExpired) {
      loginUrl.searchParams.set("expired", "true");
    }
    const response = NextResponse.redirect(loginUrl);
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    return response;
  }

  // Admin route protection
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Allow request through
  const response = NextResponse.next();
  if (!isPublicRoute) {
    response.headers.set("Cache-Control", "no-store, must-revalidate");
  }
  return response;
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icons/).*)"],
};
