import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

// PATCH /api/admin/withdrawals/[id] — approve or reject a withdrawal
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { action, adminNote } = await req.json();

  if (!['APPROVED', 'REJECTED'].includes(action))
    return NextResponse.json({ error: 'action must be APPROVED or REJECTED' }, { status: 400 });

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id: params.id } });
  if (!withdrawal)
    return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 });

  const allowedStatuses = ['PENDING_VERIFICATION', 'PENDING'];
  if (!allowedStatuses.includes(withdrawal.status))
    return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 409 });

  const updated = await prisma.$transaction(async (tx) => {
    const wd = await tx.withdrawal.update({
      where: { id: params.id },
      data: { status: action, adminNote: adminNote ?? null },
    });

    // Return funds to user on rejection
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
