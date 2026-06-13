import { NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

// ── GET /api/user/dashboard ───────────────────────────────────────────────────
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id:                     true,
        name:                   true,
        firstName:              true,
        email:                  true,
        portfolioBalance:       true,
        portfolioChangePercent: true,
        realisedPnl:            true,
        volatility:             true,
        riskLabel:              true,
        kycStatus:              true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [transactions, positions, notifications, activityLogs] = await Promise.all([
      prisma.transaction.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: {
          id:        true,
          type:      true,
          asset:     true,
          amount:    true,
          status:    true,
          createdAt: true,
        },
      }),

      prisma.position.findMany({
        where: { userId: user.id },
      }),

      prisma.notification.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: { id: true, message: true, read: true },
      }),

      prisma.activityLog.findMany({
        where:   { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take:    10,
        select: { id: true, description: true },
      }),
    ]);

    const openPositions   = positions.filter(p => p.status === 'OPEN');
    const profitPositions = openPositions.filter(p => p.currentPnl > 0);
    const lossPositions   = openPositions.filter(p => p.currentPnl <= 0);

    return NextResponse.json({
      user,
      transactions,
      positions: {
        open:   openPositions.length,
        profit: profitPositions.length,
        loss:   lossPositions.length,
      },
      notifications,
      activityLogs,
    });

  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

// ── POST /api/user/dashboard ──────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, amount, type, source, note } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing user id' }, { status: 400 });
    }

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const currentUser = await prisma.user.findUnique({ where: { id } });

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const currentBalance = Number(currentUser.portfolioBalance) || 0;

    let newBalance = currentBalance;
    if (type === 'add')           newBalance = currentBalance + amount;
    else if (type === 'subtract') newBalance = currentBalance - amount;

    const depositAgg = await prisma.deposit.aggregate({
      where: { userId: id, status: 'COMPLETED' },
      _sum:  { amount: true },
    });
    const totalDeposited = Number(depositAgg._sum.amount) || 0;

    const newRealisedPnl   = newBalance - totalDeposited;
    const newChangePercent =
      totalDeposited > 0
        ? ((newBalance - totalDeposited) / totalDeposited) * 100
        : 0;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        previousBalance:        currentBalance,
        portfolioBalance:       newBalance,
        realisedPnl:            newRealisedPnl,
        portfolioChangePercent: newChangePercent,
      },
    });

    const txType =
      source === 'trade_profit' ? 'Trade'     :
      source === 'trade_loss'   ? 'Trade'     :
      type   === 'add'          ? 'Deposit'   :
                                  'Withdrawal';

    const txAction =
      source === 'trade_profit' ? 'Profit' :
      source === 'trade_loss'   ? 'Loss'   :
      note                      ? note     :
                                  undefined;

    await prisma.transaction.create({
      data: {
        userId: id,
        type:   txType,
        amount: amount,
        status: 'COMPLETED',
        asset:  'USD',
        ...(txAction ? { action: txAction } : {}),
      },
    });

    console.log(
      `[Balance] user=${id} source=${source || type} ` +
      `old=${currentBalance} → new=${newBalance} ` +
      `pnl=${newRealisedPnl.toFixed(2)} pct=${newChangePercent.toFixed(2)}%`
    );

    return NextResponse.json({ user: updatedUser });

  } catch (error) {
    console.error('Balance API Error:', error);
    return NextResponse.json({ error: 'Failed to update balance' }, { status: 500 });
  }
}
