import { prisma } from '@/lib/prisma';

const CACHE_TTL_MS = 30_000;
const cache = new Map<string, { price: number; change24h: number; fetchedAt: number }>();

const YAHOO_SYMBOL_MAP: Record<string, string> = {
  USOIL: 'CL=F', UKOIL: 'BZ=F', XAUUSD: 'GC=F',
  EURUSD: 'EURUSD=X', GBPUSD: 'GBPUSD=X', USDJPY: 'JPY=X',
  AAPL: 'AAPL', TSLA: 'TSLA', NVDA: 'NVDA', MSFT: 'MSFT', AMZN: 'AMZN', GOOGL: 'GOOGL',
};

export async function getPrice(symbol: string): Promise<number> {
  const cached = cache.get(symbol);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.price;
  }

  let price = 0;

  if (YAHOO_SYMBOL_MAP[symbol]) {
    const ticker = YAHOO_SYMBOL_MAP[symbol];
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ticker}`);
    if (!res.ok) throw new Error('Yahoo fetch failed');
    const data = await res.json();
    price = data.chart.result[0].meta.regularMarketPrice;
  } else {
    const coin = await prisma.marketPrice.findFirst({
      where: { isActive: true, symbol: { equals: symbol } },
    });
    if (!coin) throw new Error(`Symbol ${symbol} not found`);
    const res = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coin.geckoId}&vs_currencies=usd`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) throw new Error('CoinGecko fetch failed');
    const data = await res.json();
    price = data[coin.geckoId]?.usd;
  }

  if (!Number.isFinite(price)) throw new Error('Invalid price');
  cache.set(symbol, { price, change24h: 0, fetchedAt: Date.now() });
  return price;
}
