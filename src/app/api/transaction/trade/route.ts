import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@root/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    const body = await req.json();
    const { action, asset, amount, price } = body;

    // Validation
    if (!action || !asset || !amount || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['BUY', 'SELL'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    const numAmount = Number(amount);
    const numPrice  = Number(price);
    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Fetch user
    const user = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true, portfolioBalance: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // BUY: must have enough balance
    if (action === 'BUY' && user.portfolioBalance < numAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create Transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          type:   'Trade',
          asset:  `${action}:${asset}`,
          amount: numAmount,
          status: 'CONFIRMED',
        },
      });

      // Update balance: BUY deducts margin, SELL credits
      const balanceDelta = action === 'BUY' ? -numAmount : numAmount;
      const updatedUser  = await tx.user.update({
        where:  { id: user.id },
        data:   { portfolioBalance: { increment: balanceDelta } },
        select: { portfolioBalance: true },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId:      user.id,
          description: `${action} ${asset} — $${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} @ $${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        },
      });

      return { transaction, newBalance: updatedUser.portfolioBalance };
    });

    return NextResponse.json({
      success:    true,
      trade:      result.transaction,
      newBalance: result.newBalance,
    });

 } catch (err: any) {
  console.error('[trade] error:', err?.message);
  console.error('[trade] stack:', err?.stack);
  return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 });
  }
}
