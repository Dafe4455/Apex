import { NextResponse } from 'next/server';
import { auth } from '../../../../../auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id:                    true,
      name:                  true,
      firstName:             true,
      email:                 true,
      portfolioBalance:      true,
      portfolioChangePercent:true,
      realisedPnl:           true,
      volatility:            true,
      riskLabel:             true,
      kycStatus:             true,
      deposits: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id:        true,
          amount:    true,
          status:    true,
          createdAt: true,
          methodLabel: true,
        },
      },
      withdrawals: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id:        true,
          amount:    true,
          status:    true,
          createdAt: true,
        },
      },
      positions: {
        where:   { status: 'OPEN' },
        orderBy: { openedAt: 'desc' },
        select: {
          id:         true,
          asset:      true,
          symbol:     true,
          side:       true,
          currentPnl: true,
          entryPrice: true,
          quantity:   true,
          openedAt:   true,
        },
      },
      notifications: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id:        true,
          message:   true,
          read:      true,
          createdAt: true,
        },
      },
      activityLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id:          true,
          description: true,
          createdAt:   true,
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Merge deposits + withdrawals into unified transaction list
  const transactions = [
    ...user.deposits.map(d => ({
      id:        d.id,
      type:      'Deposit' as const,
      asset:     d.methodLabel ?? 'USD',
      amount:    d.amount,
      status:    d.status === 'COMPLETED' ? 'COMPLETED'
               : d.status === 'REJECTED'  ? 'FAILED'
               : 'PENDING',
      createdAt: d.createdAt.toISOString(),
    })),
    ...user.withdrawals.map(w => ({
      id:        w.id,
      type:      'Withdrawal' as const,
      asset:     'USD',
      amount:    w.amount,
      status:    w.status === 'APPROVED'  ? 'COMPLETED'
               : w.status === 'REJECTED'  ? 'FAILED'
               : 'PENDING',
      createdAt: w.createdAt.toISOString(),
    })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
   .slice(0, 10);

  const openPositions  = user.positions.length;
  const profitPositions = user.positions.filter(p => p.currentPnl >= 0).length;
  const lossPositions   = user.positions.filter(p => p.currentPnl < 0).length;

  return NextResponse.json({
    user: {
      id:                    user.id,
      name:                  user.name,
      firstName:             user.firstName ?? user.name?.split(' ')[0] ?? 'there',
      email:                 user.email,
      portfolioBalance:      user.portfolioBalance,
      portfolioChangePercent:user.portfolioChangePercent,
      realisedPnl:           user.realisedPnl,
      volatility:            user.volatility,
      riskLabel:             user.riskLabel,
      kycStatus:             user.kycStatus,
    },
    transactions,
    positions: {
      open:   openPositions,
      profit: profitPositions,
      loss:   lossPositions,
      items:  user.positions,
    },
    notifications: user.notifications,
    activityLogs:  user.activityLogs,
  });
}
