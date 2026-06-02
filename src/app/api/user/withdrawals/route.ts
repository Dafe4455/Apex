import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

// GET — list current user's withdrawals
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const withdrawals = await prisma.withdrawal.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      note: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ withdrawals });
}

// POST — submit a new withdrawal request
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { amount, currency = 'USD', method, details, note } = await req.json();

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
  }

  if (Number(amount) < 50) {
    return NextResponse.json({ error: 'Minimum withdrawal is $50' }, { status: 400 });
  }

  // Check user has sufficient balance
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { portfolioBalance: true },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.portfolioBalance < Number(amount)) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
  }

  // Build a readable note from method details
  const detailsNote = details
    ? Object.entries(details as Record<string, string>)
        .filter(([, v]) => v)
        .map(([k, v]) => `${k}: ${v}`)
        .join(' | ')
    : null;

  const fullNote = [note, detailsNote].filter(Boolean).join(' — ') || null;

  const withdrawal = await prisma.withdrawal.create({
    data: {
      userId,
      amount:   Number(amount),
      currency,
      status:   'PENDING',
      note:     fullNote,
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      userId,
      description: `Withdrawal of $${Number(amount).toLocaleString()} requested via ${method ?? 'unknown'}`,
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId,
      message: `Your withdrawal request of $${Number(amount).toLocaleString()} has been received and is under review`,
    },
  });

  return NextResponse.json({ withdrawal }, { status: 201 });
}
