import { NextResponse } from 'next/server';

const FINNHUB_KEY = process.env.FINNHUB_API_KEY ?? '';

const CRYPTO_SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'];
const STOCK_SYMBOLS  = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'AMZN', 'GOOGL'];

const CRYPTO_META: Record<string, { name: string; logoUrl: string }> = {
  BTC:  { name: 'Bitcoin',  logoUrl: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  ETH:  { name: 'Ethereum', logoUrl: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  SOL:  { name: 'Solana',   logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  BNB:  { name: 'BNB',      logoUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
};

const STOCK_META: Record<string, { name: string; logoUrl: string }> = {
  AAPL:  { name: 'Apple Inc.',    logoUrl: 'https://img.logo.dev/apple.com?token=pk_NdDz5eDOQFSlkWRQEkcXfQ' },
  TSLA:  { name: 'Tesla Inc.',    logoUrl: 'https://img.logo.dev/tesla.com?token=pk_NdDz5eDOQFSlkWRQEkcXfQ' },
  NVDA:  { name: 'NVIDIA Corp.',  logoUrl: 'https://img.logo.dev/nvidia.com?token=pk_NdDz5eDOQFSlkWRQEkcXfQ' },
  MSFT:  { name: 'Microsoft',     logoUrl: 'https://img.logo.dev/microsoft.com?token=pk_NdDz5eDOQFSlkWRQEkcXfQ' },
  AMZN:  { name: 'Amazon',        logoUrl: 'https://img.logo.dev/amazon.com?token=pk_NdDz5eDOQFSlkWRQEkcXfQ' },
  GOOGL: { name: 'Alphabet Inc.', logoUrl: 'https://img.logo.dev/google.com?token=pk_NdDz5eDOQFSlkWRQEkcXfQ' },
};

async function fetchCrypto() {
  try {
    const results = await Promise.all(
      CRYPTO_SYMBOLS.map(async (sym) => {
        const [tickerRes, statsRes] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${sym}`),
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`),
        ]);
        const ticker = await tickerRes.json();
        const stats  = await statsRes.json();
        const base   = sym.replace('USDT', '');
        return {
          symbol:        base,
          name:          CRYPTO_META[base]?.name ?? base,
          logoUrl:       CRYPTO_META[base]?.logoUrl ?? '',
          price:         parseFloat(ticker.price),
          changePercent: parseFloat(stats.priceChangePercent),
        };
      })
    );
    return results;
  } catch {
    return [];
  }
}

async function fetchStocks() {
  if (!FINNHUB_KEY) return [];
  try {
    const results = await Promise.all(
      STOCK_SYMBOLS.map(async (sym) => {
        const res  = await fetch(
          `https://finnhub.io/api/v1/quote?symbol=${sym}&token=${FINNHUB_KEY}`
        );
        const data = await res.json();
        return {
          symbol:        sym,
          name:          STOCK_META[sym]?.name ?? sym,
          logoUrl:       STOCK_META[sym]?.logoUrl ?? '',
          price:         data.c ?? 0,
          changePercent: data.dp ?? 0,
        };
      })
    );
    return results.filter((s) => s.price > 0);
  } catch {
    return [];
  }
}

export async function GET() {
  const [crypto, stocks] = await Promise.all([fetchCrypto(), fetchStocks()]);
  const all = [...crypto, ...stocks];
  return NextResponse.json(all, {
    headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=60' },
  });
}
