import { auth } from "@root/auth";
import { NextResponse } from "next/server";

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
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icons/).*)" ],
};
