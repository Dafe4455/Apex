import { auth } from "@root/auth";
import { NextResponse } from "next/server";

const supportedLocales = ["en", "fr", "es", "pt", "ja", "de"];
const defaultLocale = "en";

const publicRoutes  = ["/", "/login", "/signup", "/admin/login", "/manifest.json", "/sw.js", "/icon-192.png", "/icon-512.png", "/offline"];
const authRoutes    = ["/login", "/signup"];

function getLocale(req: Request & { cookies: any }): string {
  // 1. Respect saved cookie
  const saved = req.cookies.get?.("locale")?.value;
  if (saved && supportedLocales.includes(saved)) return saved;

  // 2. Fall back to Accept-Language
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

  if (!hasLocale) {
    const locale = getLocale(req as any);
    const localeUrl = new URL(`/${locale}${rawPath}`, nextUrl);
    localeUrl.search = nextUrl.search;
    return NextResponse.redirect(localeUrl);
  }

  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL(`/${getLocale(req as any)}/dashboard`, nextUrl));
  }

  if (!isPublicRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(`/${getLocale(req as any)}/login`, nextUrl));
  }

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL(`/${getLocale(req as any)}/dashboard`, nextUrl));
  }

  const rewriteUrl = new URL(cleanPath || "/", nextUrl);
  rewriteUrl.search = nextUrl.search;
  return NextResponse.rewrite(rewriteUrl);
});

export const config = {
  matcher: ["/((?!api/|_next/static|_next/image|favicon.ico|icons/).*)" ],
};
