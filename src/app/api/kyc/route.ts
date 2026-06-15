import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const submission = await prisma.kYCSubmission.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ submission });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { documentType, frontUrl, backUrl, selfieUrl } = await req.json().catch(() => ({}));

  if (!documentType || !frontUrl || !selfieUrl) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Upsert — allow resubmission if rejected
  const existing = await prisma.kYCSubmission.findUnique({ where: { userId: session.user.id } });

  if (existing && existing.status === "PENDING") {
    return NextResponse.json({ error: "Your KYC is already under review." }, { status: 409 });
  }
  if (existing && existing.status === "APPROVED") {
    return NextResponse.json({ error: "Your KYC is already approved." }, { status: 409 });
  }

  const submission = existing
    ? await prisma.kYCSubmission.update({
        where: { userId: session.user.id },
        data: { documentType, frontUrl, backUrl: backUrl ?? null, selfieUrl, status: "PENDING", submittedAt: new Date(), reviewedAt: null, notes: null },
      })
    : await prisma.kYCSubmission.create({
        data: { userId: session.user.id, documentType, frontUrl, backUrl: backUrl ?? null, selfieUrl },
      });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { kycStatus: "PENDING" },
  });

  return NextResponse.json({ ok: true, submission });
}
