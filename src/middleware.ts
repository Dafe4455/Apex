import { auth } from "@root/auth";
import { NextResponse } from "next/server";

const publicRoutes = ["/", "/login", "/signup", "/admin/login"];
const authRoutes   = ["/login", "/signup"];
const adminRoutes  = ["/dashboard/admin"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn  = !!req.auth;
  const role        = (req.auth?.user as any)?.role as string | undefined;

  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  const isAuthRoute   = authRoutes.includes(nextUrl.pathname);
  const isAdminRoute  = nextUrl.pathname.startsWith('/dashboard/admin');

  // Redirect logged-in users away from login/signup
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Block non-admins from /dashboard/admin/*
  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
