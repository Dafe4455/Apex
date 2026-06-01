import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';

// GET — list all deposits for admin
export async function GET() {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const deposits = await prisma.deposit.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json(deposits);
}

// PATCH — approve or reject a deposit
export async function PATCH(req: Request) {
  const session = await auth();
  if ((session?.user as any)?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { depositId, action, adminNote } = await req.json();

  if (!depositId || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const deposit = await prisma.deposit.findUnique({
    where: { id: depositId },
  });

  if (!deposit) {
    return NextResponse.json({ error: 'Deposit not found' }, { status: 404 });
  }

  if (deposit.status !== 'PENDING') {
    return NextResponse.json({ error: 'Deposit already processed' }, { status: 409 });
  }

  if (action === 'approve') {
    // Update deposit status + add amount to user balance in one transaction
    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: depositId },
        data:  { status: 'CONFIRMED', adminNote },
      }),
      prisma.user.update({
        where: { id: deposit.userId },
        data:  { portfolioBalance: { increment: deposit.amount } },
      }),
      prisma.activityLog.create({
        data: {
          userId:      deposit.userId,
          description: `Deposit of $${deposit.amount.toLocaleString()} approved`,
        },
      }),
      prisma.notification.create({
        data: {
          userId:  deposit.userId,
          message: `Your deposit of $${deposit.amount.toLocaleString()} has been approved`,
        },
      }),
    ]);
  } else {
    await prisma.$transaction([
      prisma.deposit.update({
        where: { id: depositId },
        data:  { status: 'REJECTED', adminNote },
      }),
      prisma.activityLog.create({
        data: {
          userId:      deposit.userId,
          description: `Deposit of $${deposit.amount.toLocaleString()} rejected`,
        },
      }),
      prisma.notification.create({
        data: {
          userId:  deposit.userId,
          message: `Your deposit of $${deposit.amount.toLocaleString()} was rejected`,
        },
      }),
    ]);
  }

  return NextResponse.json({ success: true });
}
