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

  function deriveOutcome(t: { action: string | null; pnl: number | null }): 'profit' | 'loss' | null {
    const normalizedAction = t.action?.toLowerCase() ?? '';
    if (normalizedAction.includes('loss'))   return 'loss';
    if (normalizedAction.includes('profit')) return 'profit';
    if (t.pnl !== null) return t.pnl >= 0 ? 'profit' : 'loss';
    return null;
  }

  function tradeTitle(t: { asset: string | null; action: string | null }) {
    if (!t.asset) return t.action ?? 'Trade';
    return t.asset.includes(':') ? t.asset.split(':')[1] : t.asset;
  }

  function tradeDescription(t: { action: string | null }) {
    if (!t.action) return 'Trade';
    if (t.action === 'Profit' || t.action === 'Loss') return `${t.action} settlement`;
    return `${t.action} order`;
  }

  const tradeEvents = trades.map(t => ({
    id: t.id,
    kind: 'trade' as const,
    title: tradeTitle(t),
    description: tradeDescription(t),
    amount: Number(t.amount),
    outcome: deriveOutcome(t),
    status: t.status,
    createdAt: t.createdAt.toISOString(),
  }));

  const withdrawalEvents = withdrawals.map(w => ({
    id: w.id,
    kind: 'withdrawal' as const,
    title: 'Withdrawal',
    description: w.note ?? 'Withdrawal',
    amount: Number(w.amount),
    outcome: null,
    status: w.status,
    createdAt: w.createdAt.toISOString(),
  }));

  const depositEvents = deposits.map(d => ({
    id: d.id,
    kind: 'deposit' as const,
    title: 'Deposit',
    description: d.methodLabel ?? 'Deposit',
    amount: Number(d.amount),
    outcome: null,
    status: d.status,
    createdAt: d.createdAt.toISOString(),
  }));

  const DEDUP_WINDOW_MS = 5000;
  const coveredTimestamps = [...tradeEvents, ...withdrawalEvents].map(e =>
    new Date(e.createdAt).getTime()
  );

  const dedupedActivity = activity.filter(a => {
    const t = a.createdAt.getTime();
    return !coveredTimestamps.some(ct => Math.abs(ct - t) <= DEDUP_WINDOW_MS);
  });

  const activityEvents = dedupedActivity.map(a => ({
    id: a.id,
    kind: 'activity' as const,
    title: 'Activity',
    description: a.description,
    amount: null,
    outcome: null,
    status: null,
    createdAt: a.createdAt.toISOString(),
  }));

  const timeline = [
    ...tradeEvents,
    ...depositEvents,
    ...withdrawalEvents,
    ...activityEvents,
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json({ timeline });
}
