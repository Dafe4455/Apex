import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { action, adminNote } = await req.json();

  if (!['APPROVED', 'REJECTED'].includes(action))
    return NextResponse.json({ error: 'action must be APPROVED or REJECTED' }, { status: 400 });

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal)
    return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

  if (!['PENDING_VERIFICATION', 'PENDING'].includes(withdrawal.status))
    return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 409 });

  const updated = await prisma.$transaction(async (tx) => {
    const wd = await tx.withdrawal.update({
      where: { id },
      data: { status: action, adminNote: adminNote ?? null },
    });

    if (action === 'REJECTED') {
      await tx.user.update({
        where: { id: withdrawal.userId },
        data: { portfolioBalance: { increment: withdrawal.amount } },
      });
    }

    return wd;
  });

  return NextResponse.json(updated);
}
