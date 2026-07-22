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
        firstName:              true,
        lastName:               true,
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
      }),
    ]);

    const openPositions   = positions.filter(p => p.status === 'OPEN');
    const profitPositions = openPositions.filter(p => Number(p.currentPnl) > 0);
    const lossPositions   = openPositions.filter(p => Number(p.currentPnl) <= 0);

    // ── Portfolio Allocation (from positions + cash) ─────────────────────────
    const allocationMap = new Map<string, { value: number; color: string }>();
    const assetColors: Record<string, string> = {
      BTC: '#f7931a', ETH: '#627eea', SOL: '#14f195', BNB: '#f0b90b',
      USDT: '#26a17b', USD: '#26a17b', AAPL: '#555555', TSLA: '#cc0000',
      NVDA: '#76b900', GOOGL: '#4285f4', MSFT: '#00a4ef',
    };

    let positionValue = 0;
    for (const pos of openPositions) {
      const val = Number(pos.currentValue) || Number(pos.notional) || 0;
      positionValue += val;
      const sym = pos.symbol.replace(/USD$/, '');
      const existing = allocationMap.get(sym);
      allocationMap.set(sym, {
        value: (existing?.value || 0) + val,
        color: assetColors[sym] || '#888888',
      });
    }

    const balance = Number(user.portfolioBalance);
    const cashValue = Math.max(0, balance - positionValue);

    if (cashValue > 0) {
      const cashSym = 'USDT';
      const existing = allocationMap.get(cashSym);
      allocationMap.set(cashSym, {
        value: (existing?.value || 0) + cashValue,
        color: assetColors[cashSym] || '#26a17b',
      });
    }

    const portfolioAllocation = Array.from(allocationMap.entries())
      .map(([symbol, { value, color }]) => ({
        asset: symbol,
        symbol,
        value: Math.round(value * 100) / 100,
        percent: balance > 0 ? Math.round((value / balance) * 1000) / 10 : 0,
        color,
      }))
      .sort((a, b) => b.value - a.value);

    // ── Portfolio History (last 30 days of daily snapshots) ────────────────
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const historyRecords = await prisma.portfolioSnapshot.findMany({
      where: {
        userId: user.id,
        date:   { gte: thirtyDaysAgo },
      },
      orderBy: { date: 'asc' },
      select: { balance: true },
    });

    // Fallback: generate synthetic history if no snapshots exist yet
    const portfolioHistory = historyRecords.length > 1
      ? historyRecords.map(r => Number(r.balance))
      : generateSyntheticHistory(balance, 12);

    // ── Activity Logs with rich detail ───────────────────────────────────
    const enrichedActivityLogs = activityLogs.map(log => {
      const type = log.type?.toLowerCase() || 'other';
      const detail = log.metadata?.detail || log.detail || '';
      const timeAgo = getTimeAgo(log.createdAt);
      return {
        id: log.id,
        description: log.description,
        detail,
        time: timeAgo,
        type,
      };
    });

    return NextResponse.json({
      user: {
        ...user,
        name: user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email,
        portfolioBalance: Number(user.portfolioBalance),
        portfolioChangePercent: Number(user.portfolioChangePercent),
        realisedPnl: Number(user.realisedPnl),
        volatility: Number(user.volatility),
      },
      transactions: transactions.map(t => ({
        ...t,
        amount: Number(t.amount),
      })),
      positions: {
        open:   openPositions.length,
        profit: profitPositions.length,
        loss:   lossPositions.length,
      },
      notifications,
      activityLogs: enrichedActivityLogs,
      portfolioAllocation,
      portfolioHistory,
    });

  } catch (error) {
    console.error('Dashboard GET error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 });
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateSyntheticHistory(currentBalance: number, points: number): number[] {
  const history: number[] = [];
  let val = currentBalance * 0.97; // start ~3% lower
  for (let i = 0; i < points; i++) {
    const drift = (currentBalance - val) / (points - i) * 0.6;
    const noise = (Math.random() - 0.5) * currentBalance * 0.015;
    val += drift + noise;
    history.push(Math.round(val * 100) / 100);
  }
  history[history.length - 1] = currentBalance;
  return history;
}

function getTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
