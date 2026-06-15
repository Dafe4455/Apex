import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name, email } = await req.json().catch(() => ({}));
  if (!name || !email) return NextResponse.json({ error: "Name and email are required." }, { status: 400 });

  const existing = await prisma.user.findFirst({
    where: { email, NOT: { id: session.user.id } },
  });
  if (existing) return NextResponse.json({ error: "Email already in use." }, { status: 409 });

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { name, email },
  });

  return NextResponse.json({ ok: true, name: user.name, email: user.email });
}
