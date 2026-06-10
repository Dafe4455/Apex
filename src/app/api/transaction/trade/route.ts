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
    const { action, asset, amount, price, leverage = 1, marginType = 'ISOLATED', marketType = 'CRYPTO' } = body;

    if (!action || !asset || !amount || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    if (!['BUY', 'SELL'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const numAmount = Number(amount);
    const numPrice  = Number(price);
    const numLev    = Number(leverage) || 1;

    if (isNaN(numAmount) || numAmount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where:  { email: session.user.email },
      select: { id: true, portfolioBalance: true },
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // ── BUY: check balance ────────────────────────────────────────────────────
    if (action === 'BUY' && user.portfolioBalance < numAmount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // ── SELL: check open position exists and amount is valid ──────────────────
    if (action === 'SELL') {
      const openPos = await prisma.position.findFirst({
        where: { userId: user.id, symbol: asset, status: 'OPEN', side: 'LONG' },
        orderBy: { openedAt: 'asc' },
      });

      if (!openPos) {
        return NextResponse.json({ error: `No open ${asset} position to sell` }, { status: 400 });
      }

      const positionValue = openPos.entryPrice * openPos.quantity;
      if (numAmount > positionValue) {
        return NextResponse.json({
          error: `Sell amount exceeds position value of ${positionValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}`,
        }, { status: 400 });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId:   user.id,
          type:     'Trade' as any,
          asset:    `${action}:${asset}`,
          amount:   numAmount,
          price:    numPrice,
          action,
          leverage: numLev,
          status:   'COMPLETED' as any,
        },
      });

      // 2. Position logic
      const quantity = (numAmount * numLev) / numPrice;

      if (action === 'BUY') {
        await tx.position.create({
          data: {
            userId:     user.id,
            asset,
            symbol:     asset,
            quantity,
            entryPrice: numPrice,
            currentPnl: 0,
            side:       'LONG',
            status:     'OPEN',
            leverage:   numLev,
            marketType,
          },
        });
      } else {
        // Close oldest open LONG position
        const openPos = await tx.position.findFirst({
          where:   { userId: user.id, symbol: asset, status: 'OPEN', side: 'LONG' },
          orderBy: { openedAt: 'asc' },
        });

        if (openPos) {
          const pnl = (numPrice - openPos.entryPrice) * openPos.quantity;
          await tx.position.update({
            where: { id: openPos.id },
            data:  { status: 'CLOSED', currentPnl: pnl, closedAt: new Date() },
          });
          await tx.user.update({
            where: { id: user.id },
            data:  { realisedPnl: { increment: pnl } },
          });
        }
      }

      // 3. Balance update
      const balanceDelta = action === 'BUY' ? -numAmount : numAmount;
      const updatedUser  = await tx.user.update({
        where:  { id: user.id },
        data:   { portfolioBalance: { increment: balanceDelta } },
        select: { portfolioBalance: true },
      });

      // 4. Activity log
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
