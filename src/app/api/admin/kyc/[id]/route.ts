import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user || (session.user as any).role !== "ADMIN")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { action, notes } = await req.json().catch(() => ({}));
  if (!["APPROVED", "REJECTED"].includes(action))
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  if (action === "REJECTED" && !notes?.trim())
    return NextResponse.json({ error: "Rejection reason required" }, { status: 400 });

  const submission = await prisma.kYCSubmission.findUnique({ where: { id } });
  if (!submission) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.kYCSubmission.update({
    where: { id },
    data: { status: action, notes: notes ?? null, reviewedAt: new Date() },
  });

  await prisma.user.update({
    where: { id: submission.userId },
    data: { kycStatus: action === "APPROVED" ? "APPROVED" : "REJECTED" },
  });

  await createNotification(
    submission.userId,
    action === "APPROVED"
      ? "Your identity verification has been approved. You now have full access to all trading features."
      : `Your identity verification was rejected. Reason: ${notes}. Please resubmit with valid documents.`
  );

  return NextResponse.json({ ok: true });
}
