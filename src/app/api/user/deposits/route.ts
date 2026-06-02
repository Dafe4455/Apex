import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

// GET — list current user's deposits
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const deposits = await prisma.deposit.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      methodLabel: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ deposits });
}

// POST — submit a new deposit
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { amount, currency = 'USD', methodId, methodLabel, note } = await req.json();

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
  }

  const deposit = await prisma.deposit.create({
    data: {
      userId,
      amount:      Number(amount),
      currency,
      methodLabel: methodLabel ?? null,
      note:        note ?? null,
      status:      'PENDING',
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      description: `Deposit of $${Number(amount).toLocaleString()} submitted via ${methodLabel ?? 'unknown'}`,
    },
  });

  return NextResponse.json({ deposit }, { status: 201 });
}
