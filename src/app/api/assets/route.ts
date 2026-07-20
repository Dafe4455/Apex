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
    select: { id: true, portfolioBalance: true, realisedPnl: true },
  });

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const [positions, trades] = await Promise.all([
    prisma.position.findMany({
      where: { userId: user.id },
      orderBy: { openedAt: 'desc' },
    }),
    prisma.transaction.findMany({
      where: { userId: user.id, type: 'Trade' as any },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    portfolioBalance: Number(user.portfolioBalance),
    realisedPnl: Number(user.realisedPnl),
    positions: positions.map(p => ({
      ...p,
      quantity: Number(p.quantity),
      entryPrice: Number(p.entryPrice),
      currentPnl: Number(p.currentPnl),
      leverage: Number(p.leverage),
    })),
    trades: trades.map(t => ({
      ...t,
      amount: Number(t.amount),
      price: t.price ? Number(t.price) : null,
      leverage: t.leverage ? Number(t.leverage) : null,
      pnl: t.pnl ? Number(t.pnl) : null,
    })),
  });
}
