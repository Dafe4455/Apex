import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const CACHE_TTL_MS = 30 * 1000;
const priceCache = new Map<string, { price: number; change24h: number; fetchedAt: number }>();

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  USOIL:  'CL=F',
  UKOIL:  'BZ=F',
  XAUUSD: 'GC=F',
  EURUSD: 'EURUSD=X',
  GBPUSD: 'GBPUSD=X',
  USDJPY: 'JPY=X',
  AAPL:   'AAPL',
  TSLA:   'TSLA',
  NVDA:   'NVDA',
  MSFT:   'MSFT',
  AMZN:   'AMZN',
  GOOGL:  'GOOGL',
};

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  if (!symbol) return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });

  const cached = priceCache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json({ symbol, price: cached.price, change24h: cached.change24h });
  }

  try {
    let price = 0;
    let change24h = 0;

    if (YAHOO_SYMBOL_MAP[symbol]) {
      // Stocks, forex, commodities via Yahoo Finance
      const ticker = YAHOO_SYMBOL_MAP[symbol];
      const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`);
      if (!res.ok) throw new Error('Yahoo fetch failed');
      const data = await res.json();
      const meta = data.chart.result[0].meta;
      price = meta.regularMarketPrice;
      const prevClose = meta.chartPreviousClose ?? meta.previousClose ?? price;
      change24h = ((price - prevClose) / prevClose) * 100;

    } else {
      // Crypto via CoinGecko DB lookup
      const coin = await prisma.marketPrice.findFirst({
        where: { isActive: true, symbol: { equals: symbol } },
      });
      if (!coin) return NextResponse.json({ error: `Symbol ${symbol} not found` }, { status: 404 });

      const res = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${coin.geckoId}&vs_currencies=usd&include_24hr_change=true`,
        { next: { revalidate: 30 } }
      );
      if (!res.ok) throw new Error('CoinGecko fetch failed');
      const data = await res.json();
      price = data[coin.geckoId]?.usd;
      change24h = data[coin.geckoId]?.usd_24h_change ?? 0;
    }

    if (!Number.isFinite(price)) throw new Error('Invalid price');

    priceCache.set(symbol, { price, change24h, fetchedAt: Date.now() });
    return NextResponse.json({ symbol, price, change24h });

  } catch (err: any) {
    if (cached) return NextResponse.json({ symbol, price: cached.price, change24h: cached.change24h });
    return NextResponse.json({ error: 'Price unavailable' }, { status: 502 });
  }
}
