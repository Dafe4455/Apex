import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  // 1. Get admin-configured coins from DB
  const coins = await prisma.marketPrice.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  if (coins.length === 0) return NextResponse.json([]);

  // 2. Build CoinGecko query from geckoIds
  const ids = coins.map(c => c.geckoId).join(',');

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
    { next: { revalidate: 60 } } // cache 60 seconds
  );

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch prices' }, { status: 502 });

  const gecko = await res.json();

  // 3. Merge live prices with your display config
  const merged = coins.map(coin => {
    const live = gecko.find((g: any) => g.id === coin.geckoId);
    return {
      id:        coin.id,
      symbol:    coin.symbol,
      name:      coin.name,
      icon:      coin.icon,
      iconBg:    coin.iconBg,
      iconCol:   coin.iconCol,
      price:     live?.current_price     ?? 0,
      change24h: live?.price_change_percentage_24h ?? 0,
      volume24h: live?.total_volume      ?? 0,
    };
  });

  return NextResponse.json(merged);
        }
