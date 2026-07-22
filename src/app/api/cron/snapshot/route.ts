// app/api/cron/snapshot/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const users = await prisma.user.findMany({
    select: { id: true, portfolioBalance: true, realisedPnl: true },
  });

  await prisma.$transaction(
    users.map(u => 
      prisma.portfolioSnapshot.upsert({
        where: {
          userId_date: { userId: u.id, date: today },
        },
        update: {
          balance: u.portfolioBalance,
          pnl: u.realisedPnl,
        },
        create: {
          userId: u.id,
          date: today,
          balance: u.portfolioBalance,
          pnl: u.realisedPnl,
        },
      })
    )
  );

  return NextResponse.json({ snapped: users.length });
}
