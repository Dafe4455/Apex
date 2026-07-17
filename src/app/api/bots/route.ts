import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';
import { hasActiveAutoTradeSubscription } from '@/lib/subscription';

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const allowed = await hasActiveAutoTradeSubscription(session.user.id);
  if (!allowed) return NextResponse.json({ error: 'No active auto-trading subscription' }, { status: 403 });

  const body = await req.json();
  const { name, strategy, config } = body;
  // config example: { symbol: "BTC", baseAmount: 100, interval: "1d" }

  const bot = await prisma.tradingBot.create({
    data: {
      userId: session.user.id,
      name,
      strategy,
      config,
      status: 'running',
    },
  });
  return NextResponse.json(bot);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bots = await prisma.tradingBot.findMany({
    where: { userId: session.user.id },
    include: { trades: { orderBy: { executedAt: 'desc' }, take: 10 } },
  });
  return NextResponse.json(bots);
}
