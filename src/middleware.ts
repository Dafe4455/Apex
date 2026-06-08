import { auth } from "@root/auth";
import { NextResponse } from "next/server";

const supportedLocales = ["en", "fr", "es", "pt", "ja", "de"];

const publicRoutes  = ["/", "/login", "/signup", "/admin/login", "/manifest.json", "/sw.js", "/icon-192.png", "/icon-512.png", "/offline"];
const authRoutes    = ["/login", "/signup"];

function getLocale(req: Request): string {
  const acceptLanguage = req.headers.get("accept-language") ?? "";
  const preferred = acceptLanguage
    .split(",")
    .map((lang) => lang.split(";")[0].trim().split("-")[0].toLowerCase());
  return preferred.find((lang) => supportedLocales.includes(lang)) ?? defaultLocale;
}

function stripLocale(pathname: string): string {
  const segments = pathname.split("/");
  if (supportedLocales.includes(segments[1])) {
    return "/" + segments.slice(2).join("/") || "/";
  }
  return pathname;
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn  = !!req.auth;
  const role        = (req.auth?.user as any)?.role as string | undefined;

  const rawPath   = nextUrl.pathname;
  const hasLocale = supportedLocales.some(
    (l) => rawPath.startsWith(`/${l}/`) || rawPath === `/${l}`
  );
  const cleanPath = stripLocale(rawPath);

  const isPublicRoute = publicRoutes.includes(cleanPath);
  const isAuthRoute   = authRoutes.includes(cleanPath);
  const isAdminRoute  = cleanPath.startsWith("/dashboard/admin");

  // 1. If no locale prefix yet, redirect to add it
  if (!hasLocale) {
    const locale = getLocale(req);
    const localeUrl = new URL(`/${locale}${rawPath}`, nextUrl);
    localeUrl.search = nextUrl.search;
    return NextResponse.redirect(localeUrl);
  }

  // 2. Auth guards (using cleanPath, no locale prefix)
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${getLocale(req)}/dashboard`, nextUrl));
  }

  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${getLocale(req)}/login`, nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${getLocale(req)}/dashboard`, nextUrl));
  }

  // 3. Rewrite /en/dashboard → /dashboard (pages stay where they are)
  const rewriteUrl = new URL(cleanPath || "/", nextUrl);
  rewriteUrl.search = nextUrl.search;
  return NextResponse.rewrite(rewriteUrl);
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icons/).*)" ],
};
