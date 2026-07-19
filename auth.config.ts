import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: { signIn: "/login", error: "/login" },
  providers: [], // empty here — real providers added in auth.ts

  callbacks: {
    // NOTE: the jwt/session logic (idle timeout, role, id) lives in
    // auth.ts, not here — auth.ts's callbacks fully own those two.
    // This file only owns `authorized`, which middleware.ts uses to
    // gate requests before a page ever renders.
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      const isProtectedRoute =
        pathname.startsWith("/dashboard") ||
        pathname.startsWith("/admin") ||
        pathname.startsWith("/settings");
      // add any other authenticated-only path prefixes here

      const isAuthPage = pathname.startsWith("/login");

      if (isProtectedRoute) {
        return isLoggedIn; // false → NextAuth redirects to pages.signIn
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return true; // everything else is public
    },
  },
};
