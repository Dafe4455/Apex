import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authConfig } from "./auth.config";
import { INACTIVITY_LIMIT_SECONDS } from '@/lib/session-config'; // ← use this

// REMOVE this line:
// const INACTIVITY_LIMIT_SECONDS = 60 * 10;

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: INACTIVITY_LIMIT_SECONDS, // ← now uses the imported value
    updateAge: 60 * 2,
  },
  // ... rest unchanged
