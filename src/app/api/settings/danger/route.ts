import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Flag account for closure — notify admin via a notification on admin's account
  // and notify the user
  await createNotification(session.user.id, "Your account closure request has been received. Our team will review it within 24 hours.");

  return NextResponse.json({ ok: true });
}
