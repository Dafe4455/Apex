import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [trades, deposits, withdrawals, activity] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id, type: 'Trade' as any },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.deposit.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  // Merge into unified timeline
  const timeline = [
    ...trades.map(t => ({
      id: t.id,
      kind: 'trade' as const,
      title: t.asset ?? 'Trade',
      description: t.action ? `${t.action} order` : 'Trade',
      amount: t.amount,
      status: t.status,
      createdAt: t.createdAt.toISOString(),
    })),
    ...deposits.map(d => ({
      id: d.id,
      kind: 'deposit' as const,
      title: 'Deposit',
      description: d.methodLabel ?? 'Deposit',
      amount: d.amount,
      status: d.status,
      createdAt: d.createdAt.toISOString(),
    })),
    ...withdrawals.map(w => ({
      id: w.id,
      kind: 'withdrawal' as const,
      title: 'Withdrawal',
      description: w.note ?? 'Withdrawal',
      amount: w.amount,
      status: w.status,
      createdAt: w.createdAt.toISOString(),
    })),
    ...activity.map(a => ({
      id: a.id,
      kind: 'activity' as const,
      title: 'Activity',
      description: a.description,
      amount: null,
      status: null,
      createdAt: a.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ timeline });
}
