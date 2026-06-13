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

  if (!['COMPLETED', 'REJECTED'].includes(action))
    return NextResponse.json({ error: 'action must be COMPLETED or REJECTED' }, { status: 400 });

  const deposit = await prisma.deposit.findUnique({ where: { id } });
  if (!deposit)
    return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });

  if (deposit.status !== 'PENDING')
    return NextResponse.json({ error: 'Deposit already processed' }, { status: 409 });

  const updated = await prisma.$transaction(async (tx) => {
    const dep = await tx.deposit.update({
      where: { id },
      data: { status: action, adminNote: adminNote ?? null },
    });

    if (action === 'COMPLETED') {
      const user = await tx.user.findUnique({ where: { id: deposit.userId } });
      const currentBalance  = Number(user?.portfolioBalance) || 0;
      const newBalance      = currentBalance + deposit.amount;

      // Recalculate PnL against all completed deposits including this one
      const depositAgg = await tx.deposit.aggregate({
        where: { userId: deposit.userId, status: 'COMPLETED' },
        _sum:  { amount: true },
      });
      const totalDeposited   = Number(depositAgg._sum.amount) || 0;
      const newRealisedPnl   = newBalance - totalDeposited;
      const newChangePercent =
        totalDeposited > 0
          ? ((newBalance - totalDeposited) / totalDeposited) * 100
          : 0;

      await tx.user.update({
        where: { id: deposit.userId },
        data: {
          previousBalance:        currentBalance,
          portfolioBalance:       newBalance,
          realisedPnl:            newRealisedPnl,
          portfolioChangePercent: newChangePercent,
        },
      });

      await tx.activityLog.create({
        data: {
          userId:      deposit.userId,
          description: `Deposit of $${deposit.amount.toLocaleString()} approved`,
        },
      });

      await tx.notification.create({
        data: {
          userId:  deposit.userId,
          message: `Your deposit of $${deposit.amount.toLocaleString()} has been approved`,
        },
      });
    } else {
      await tx.activityLog.create({
        data: {
          userId:      deposit.userId,
          description: `Deposit of $${deposit.amount.toLocaleString()} rejected`,
        },
      });

      await tx.notification.create({
        data: {
          userId:  deposit.userId,
          message: `Your deposit of $${deposit.amount.toLocaleString()} was rejected`,
        },
      });
    }

    return dep;
  });

  return NextResponse.json(updated);
}
