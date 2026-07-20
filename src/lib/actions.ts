"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signIn } from "@root/auth";
import { AuthError } from "next-auth";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  country: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function signupAction(formData: {
  name: string;
  email: string;
  phone?: string;
  country?: string;
  password: string;
}) {
  const parsed = signupSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { name, email, phone, country, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  // Split full name into firstName + lastName
  const nameParts = name.trim().split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(" ") || null;

  await prisma.user.create({
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      country: country || null,
      password: hashedPassword,
    },
  });

  // Auto sign in after signup
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created but login failed. Please sign in." };
    }
    throw error;
  }
}

export async function loginAction(formData: {
  email: string;
  password: string;
}) {
  try {
    await signIn("credentials", { ...formData, redirectTo: "/dashboard" });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    throw error;
  }
}
