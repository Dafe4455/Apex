import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { current, next } = await req.json().catch(() => ({}));
  if (!current || !next) return NextResponse.json({ error: "All fields are required." }, { status: 400 });
  if (next.length < 8) return NextResponse.json({ error: "New password must be at least 8 characters." }, { status: 400 });

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) return NextResponse.json({ error: "No password set on this account." }, { status: 400 });

  const match = await bcrypt.compare(current, user.password);
  if (!match) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

  const hashed = await bcrypt.hash(next, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return NextResponse.json({ ok: true });
}
