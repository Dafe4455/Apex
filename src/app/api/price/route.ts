import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  // Match symbol in DB (case-insensitive)
  // Trade page sends e.g. "BTC" (stripped of USD), so we match against the stored symbol
  const coin = await prisma.marketPrice.findFirst({
    where: {
      isActive: true,
      symbol: { equals: symbol.toUpperCase() },
    },
  });

  if (!coin) {
    return NextResponse.json({ error: `Symbol ${symbol} not found` }, { status: 404 });
  }

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coin.geckoId}&vs_currencies=usd`,
    { next: { revalidate: 30 } }
  );

  if (!res.ok) {
    return NextResponse.json({ error: 'Failed to fetch price' }, { status: 502 });
  }

  const data = await res.json();
  const price = data[coin.geckoId]?.usd;

  if (price === undefined) {
    return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });
  }

  return NextResponse.json({ symbol: coin.symbol, price });
}
