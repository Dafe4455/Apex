import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      _sum: { amount: true },
    });
    const totalDeposited = Number(depositAgg._sum.amount) || 0;

    const newRealisedPnl = newBalance - totalDeposited;

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

    // Map to valid TransactionType enum: Deposit | Withdrawal | Trade
    const txType =
      source === 'trade_profit' ? 'Trade'      :
      source === 'trade_loss'   ? 'Trade'      :
      type   === 'add'          ? 'Deposit'    :
                                  'Withdrawal';

    // Store profit/loss direction in the action field
    const txAction =
      source === 'trade_profit' ? 'Profit'     :
      source === 'trade_loss'   ? 'Loss'       :
      note                      ? note         :
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
