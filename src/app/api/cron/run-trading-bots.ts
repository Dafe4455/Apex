import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hasActiveAutoTradeSubscription } from '@/lib/subscription';
import { executeTrade } from '@/lib/tradeService';
import { getPrice } from '@/lib/priceService';

function parseInterval(interval: string): number {
  const units: Record<string, number> = { m: 60000, h: 3600000, d: 86400000, w: 604800000 };
  const match = interval.match(/^(\d+)([mhdw])$/);
  if (!match) return 86400000; // default 1 day
  return parseInt(match[1]) * (units[match[2]] || 86400000);
}

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  const now = new Date();
  const bots = await prisma.tradingBot.findMany({
    where: { status: 'running' },
    include: { user: true },
  });

  let processed = 0;
  for (const bot of bots) {
    // Check subscription
    const subActive = await hasActiveAutoTradeSubscription(bot.userId);
    if (!subActive) continue;

    const config = bot.config as any;
    if (bot.lastRun) {
      const intervalMs = parseInterval(config.interval);
      if (Date.now() - bot.lastRun.getTime() < intervalMs) continue;
    }

    try {
      const price = await getPrice(config.symbol);
      const baseAmount = config.baseAmount;

      // Execute BUY trade
      await executeTrade({
        userId: bot.userId,
        action: 'BUY',
        asset: config.symbol,
        amount: baseAmount,
        price,
        marketType: 'CRYPTO', // you can infer from config or asset type
      });

      // Record BotTrade
      const quantity = baseAmount / price;
      await prisma.botTrade.create({
        data: {
          botId: bot.id,
          symbol: config.symbol,
          side: 'BUY',
          quantity,
          price,
          amount: baseAmount,
        },
      });

      // Update lastRun
      await prisma.tradingBot.update({
        where: { id: bot.id },
        data: { lastRun: now },
      });
      processed++;
    } catch (err) {
      console.error(`Bot ${bot.id} failed:`, err);
    }
  }

  return NextResponse.json({ processed });
}
