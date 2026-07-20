import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submissions = await prisma.kYCSubmission.findMany({
    orderBy: { submittedAt: "desc" },
    include: { user: { select: { firstName: true, lastName: true, email: true } } },
  });

  return NextResponse.json({ submissions });
}
