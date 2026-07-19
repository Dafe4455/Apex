import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Idle timeout: how long a session survives with no activity.
const INACTIVITY_LIMIT_SECONDS = 60 * 10; // 10 minutes

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: INACTIVITY_LIMIT_SECONDS,
    // How often activity refreshes the expiry clock. Shorter = more
    // accurate idle detection but more token re-signing/cookie writes.
    // 2 minutes is a reasonable balance for a 10-minute timeout.
    updateAge: 60 * 2,
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user || !user.password) return null;
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;
        return { id: user.id, email: user.email, name: user.name, image: user.image, role: user.role };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);

      // Initial sign-in — stamp the token with identity and a fresh
      // activity timestamp.
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.lastActive = now;
        return token;
      }

      // Every subsequent request: check idle time since last activity.
      const lastActive = (token.lastActive as number) ?? now;
      if (now - lastActive > INACTIVITY_LIMIT_SECONDS) {
        // Returning null invalidates the token — auth() will resolve
        // to no session, effectively logging the user out.
        return null;
      }

      // Still within the idle window — refresh the activity timestamp
      // so the clock resets on each active request.
      token.lastActive = now;
      return token;
    },
    async session({ session, token }) {
      if (!token) return session;
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
});
