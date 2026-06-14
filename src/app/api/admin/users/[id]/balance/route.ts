import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

function isAdmin(s: any) { return s?.user?.role === 'ADMIN'; }

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const { amount, type, source, note } = await req.json();

  if (!amount || isNaN(parseFloat(amount)))
    return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });

  if (!['add', 'subtract'].includes(type))
    return NextResponse.json({ error: 'type must be add or subtract' }, { status: 400 });

  const currentUser = await prisma.user.findUnique({
    where: { id },
    select: { portfolioBalance: true, realisedPnl: true },
  });

  if (!currentUser)
    return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const parsedAmount   = parseFloat(amount);
  const currentBalance = Number(currentUser.portfolioBalance) || 0;
  const delta          = type === 'add' ? parsedAmount : -parsedAmount;
  const newBalance     = currentBalance + delta;

  // Deposits don't count as P&L — everything else does
  const isDeposit      = type === 'add' && !source?.startsWith('trade');
  const pnlDelta       = isDeposit ? 0 : delta;
  const newRealisedPnl = (Number(currentUser.realisedPnl) || 0) + pnlDelta;

  const depositAgg = await prisma.deposit.aggregate({
    where: { userId: id, status: 'COMPLETED' },
    _sum:  { amount: true },
  });
  const totalDeposited   = Number(depositAgg._sum.amount) || 0;
  const newChangePercent = totalDeposited > 0
    ? (newRealisedPnl / totalDeposited) * 100
    : 0;

  const txType =
    source === 'trade_profit' ? 'Trade'      :
    source === 'trade_loss'   ? 'Trade'      :
    type   === 'add'          ? 'Deposit'    :
                                'Withdrawal';

  const txAction =
    source === 'trade_profit' ? 'Profit'  :
    source === 'trade_loss'   ? 'Loss'    :
    note                      ? note      :
                                undefined;

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id },
      data: {
        previousBalance:        currentBalance,
        portfolioBalance:       newBalance,
        realisedPnl:            newRealisedPnl,
        portfolioChangePercent: newChangePercent,
      },
    }),
    prisma.transaction.create({
      data: {
        userId: id,
        type:   txType,
        amount: parsedAmount,
        status: 'COMPLETED',
        asset:  'USD',
        ...(txAction ? { action: txAction } : {}),
      },
    }),
  ]);

  console.log(
    `[Admin Balance] user=${id} source=${source || type} ` +
    `old=${currentBalance} → new=${newBalance} ` +
    `pnlDelta=${pnlDelta} pnl=${newRealisedPnl.toFixed(2)} pct=${newChangePercent.toFixed(2)}%`
  );

  return NextResponse.json({ user: updatedUser });
}
