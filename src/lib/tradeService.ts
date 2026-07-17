import { prisma } from '@/lib/prisma';

interface TradeParams {
  userId: string;
  action: 'BUY' | 'SELL';
  asset: string;
  amount: number;
  price: number;
  leverage?: number;
  marginType?: string;
  marketType?: string;
}

export async function executeTrade(params: TradeParams) {
  const { userId, action, asset, amount, price, leverage = 1, marginType = 'ISOLATED', marketType = 'CRYPTO' } = params;

  if (!['BUY', 'SELL'].includes(action)) throw new Error('Invalid action');
  if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, portfolioBalance: true },
  });
  if (!user) throw new Error('User not found');

  if (action === 'BUY' && user.portfolioBalance < amount) {
    throw new Error('Insufficient balance');
  }

  // SELL validation
  let openPosForSell = null;
  if (action === 'SELL') {
    openPosForSell = await prisma.position.findFirst({
      where: { userId, symbol: asset, status: 'OPEN', side: 'LONG' },
      orderBy: { openedAt: 'asc' },
    });
    if (!openPosForSell) throw new Error(`No open ${asset} position to sell`);
    const positionValue = openPosForSell.entryPrice * openPosForSell.quantity;
    if (amount > positionValue) throw new Error(`Sell amount exceeds position value`);
  }

  return prisma.$transaction(async (tx) => {
    let sellPnl = null;
    if (action === 'SELL' && openPosForSell) {
      sellPnl = (price - openPosForSell.entryPrice) * openPosForSell.quantity;
    }

    const transaction = await tx.transaction.create({
      data: {
        userId,
        type: 'Trade' as any,
        asset: `${action}:${asset}`,
        amount,
        price,
        action,
        leverage,
        pnl: sellPnl,
        status: 'COMPLETED' as any,
      },
    });

    const quantity = (amount * leverage) / price;

    if (action === 'BUY') {
      await tx.position.create({
        data: {
          userId,
          asset,
          symbol: asset,
          quantity,
          entryPrice: price,
          currentPnl: 0,
          side: 'LONG',
          status: 'OPEN',
          leverage,
          marketType,
        },
      });
    } else {
      const openPos = await tx.position.findFirst({
        where: { userId, symbol: asset, status: 'OPEN', side: 'LONG' },
        orderBy: { openedAt: 'asc' },
      });
      if (openPos) {
        const pnl = (price - openPos.entryPrice) * openPos.quantity;
        await tx.position.update({
          where: { id: openPos.id },
          data: { status: 'CLOSED', currentPnl: pnl, closedAt: new Date() },
        });
        await tx.user.update({
          where: { id: userId },
          data: { realisedPnl: { increment: pnl } },
        });
      }
    }

    const balanceDelta = action === 'BUY' ? -amount : amount;
    const updatedUser = await tx.user.update({
      where: { id: userId },
      data: { portfolioBalance: { increment: balanceDelta } },
      select: { portfolioBalance: true },
    });

    await tx.activityLog.create({
      data: {
        userId,
        description: `${action} ${asset} — $${amount.toLocaleString()} @ $${price.toLocaleString()}`,
      },
    });

    return { transaction, newBalance: updatedUser.portfolioBalance };
  });
}
