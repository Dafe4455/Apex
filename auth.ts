import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { INACTIVITY_LIMIT_SECONDS } from "@/lib/session-config";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24, // 24 hours — cookie lifetime
    updateAge: 60 * 2,   // refresh every 2 minutes of activity
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

        const fullName = user.firstName
          ? `${user.firstName} ${user.lastName || ""}`.trim()
          : user.email.split("@")[0];

        return {
          id: user.id,
          email: user.email,
          name: fullName,
          firstName: user.firstName,
          lastName: user.lastName,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      const now = Math.floor(Date.now() / 1000);

      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
        token.lastActive = now;
        return token;
      }

      const lastActive = (token.lastActive as number) ?? now;

      // DON'T return null — let middleware handle expiry detection
      // Returning null triggers NEXT_REDIRECT throw internally
      if (now - lastActive > INACTIVITY_LIMIT_SECONDS) {
        // Keep stale token — middleware will see old lastActive and redirect
        return token;
      }

      token.lastActive = now;
      return token;
    },
    async session({ session, token }) {
      if (!token) return session;
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).firstName = token.firstName;
        (session.user as any).lastName = token.lastName;
      }
      return session;
    },
  },
});
