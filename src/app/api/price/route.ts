import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? '';

const STOCK_SYMBOLS = new Set(['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL']);
const FOREX_COMMODITIES = new Set(['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'USOIL', 'UKOIL']);

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }

  // ── Stocks via Finnhub ──────────────────────────────────────────────────
  if (STOCK_SYMBOLS.has(symbol)) {
    if (!FINNHUB_KEY) return NextResponse.json({ error: 'No Finnhub key' }, { status: 500 });
    const res  = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_KEY}`);
    const data = await res.json();
    if (!data.c) return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });
    return NextResponse.json({ symbol, price: data.c, change24h: data.dp ?? 0 });
  }

  // ── Forex & Commodities via Finnhub ────────────────────────────────────
  if (FOREX_COMMODITIES.has(symbol)) {
    if (!FINNHUB_KEY) return NextResponse.json({ error: 'No Finnhub key' }, { status: 500 });
    // Finnhub forex uses OANDA: prefix, commodities use their own symbols
    const finnhubSym = symbol === 'XAUUSD' ? 'OANDA:XAU_USD'
      : symbol === 'USOIL'  ? 'OANDA:BCO_USD'
      : symbol === 'UKOIL'  ? 'OANDA:BCO_USD'
      : `OANDA:${symbol.slice(0, 3)}_${symbol.slice(3)}`;
    const res  = await fetch(`https://finnhub.io/api/v1/quote?symbol=${finnhubSym}&token=${FINNHUB_KEY}`);
    const data = await res.json();
    if (!data.c) return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });
    return NextResponse.json({ symbol, price: data.c, change24h: data.dp ?? 0 });
  }

  // ── Crypto via CoinGecko (existing logic) ──────────────────────────────
  const coin = await prisma.marketPrice.findFirst({
    where: { isActive: true, symbol: { equals: symbol } },
  });

  if (!coin) {
    return NextResponse.json({ error: `Symbol ${symbol} not found` }, { status: 404 });
  }

  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${coin.geckoId}&vs_currencies=usd&include_24hr_change=true`,
    { next: { revalidate: 30 } }
  );

  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch price' }, { status: 502 });

  const data = await res.json();
  const price    = data[coin.geckoId]?.usd;
  const change24h = data[coin.geckoId]?.usd_24h_change ?? 0;

  if (price === undefined) return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });

  return NextResponse.json({ symbol, price, change24h });
}
