import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { TransactionType } from '@prisma/client';

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
      where: { userId: user.id, type: TransactionType.Trade },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return NextResponse.json({
    portfolioBalance: user.portfolioBalance,
    realisedPnl: user.realisedPnl,
    positions,
    trades,
  });
}
