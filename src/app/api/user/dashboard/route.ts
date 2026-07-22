// src/app/api/user/dashboard/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        portfolioBalance: true, portfolioChangePercent: true,
        realisedPnl: true, volatility: true, riskLabel: true, kycStatus: true,
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Critical path: positions + transactions (needed for allocation)
    const [transactions, positions] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, type: true, asset: true, amount: true, status: true, createdAt: true },
      }),
      prisma.position.findMany({ where: { userId: user.id } }),
    ]);

    // Non-critical: run sequentially to avoid pool exhaustion
    const notifications = await prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, message: true, read: true },
    });

    const activityLogs = await prisma.activityLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // ... rest of your logic unchanged
