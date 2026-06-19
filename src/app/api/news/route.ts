import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export const revalidate = 300; // cache for 5 minutes at the edge/runtime layer

type NewsItem = {
  headline: string;
  summary: string;
  source: string;
  time: string;
  tag: 'CRYPTO' | 'FOREX' | 'STOCKS' | 'MACRO' | 'COMMODITIES';
  url: string;
  publishedAt: number; // unix ms, used for sorting only — not rendered directly
};

function timeAgo(unixMs: number): string {
  const diffMs = Date.now() - unixMs;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .trim();
}

// ── CryptoCompare news (no API key required) ──────────────────────────────────

async function fetchCryptoNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://min-api.cryptocompare.com/data/v2/news/?lang=EN', {
      headers: { Accept: 'application/json' },
      // Server-side fetch — fine to cache briefly since this hits an external API.
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const articles = data?.Data ?? [];

    return articles.slice(0, 8).map((a: any): NewsItem => ({
      headline: stripHtml(a.title ?? '').slice(0, 140),
      summary: stripHtml(a.body ?? '').slice(0, 400),
      source: a.source_info?.name ?? a.source ?? 'CryptoCompare',
      time: timeAgo((a.published_on ?? 0) * 1000),
      tag: 'CRYPTO',
      url: a.url ?? '',
      publishedAt: (a.published_on ?? 0) * 1000,
    }));
  } catch {
    return [];
  }
}

// ── BBC Business RSS (finance/macro) ───────────────────────────────────────────

function guessFinanceTag(title: string): NewsItem['tag'] {
  const t = title.toLowerCase();
  if (/\boil\b|gold|commodit|crude|opec/.test(t))            return 'COMMODITIES';
  if (/dollar|euro|pound|yen|forex|currency|currencies/.test(t)) return 'FOREX';
  if (/stock|shares|nasdaq|s&p|dow|equit/.test(t))            return 'STOCKS';
  return 'MACRO';
}

async function fetchFinanceNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch('https://feeds.bbci.co.uk/news/business/rss.xml', {
      headers: { Accept: 'application/rss+xml, application/xml, text/xml' },
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const xml = await res.text();

    const parser = new XMLParser({ ignoreAttributes: false });
    const parsed = parser.parse(xml);
    const items = parsed?.rss?.channel?.item ?? [];
    const list = Array.isArray(items) ? items : [items];

    return list.slice(0, 8).map((item: any): NewsItem => {
      const pubDate = item.pubDate ? new Date(item.pubDate).getTime() : Date.now();
      const title = stripHtml(String(item.title ?? ''));
      return {
        headline: title.slice(0, 140),
        summary: stripHtml(String(item.description ?? '')).slice(0, 400),
        source: 'BBC News',
        time: timeAgo(pubDate),
        tag: guessFinanceTag(title),
        url: typeof item.link === 'string' ? item.link : (item.link?.['#text'] ?? ''),
        publishedAt: pubDate,
      };
    });
  } catch {
    return [];
  }
}

export async function GET() {
  const [crypto, finance] = await Promise.all([
    fetchCryptoNews(),
    fetchFinanceNews(),
  ]);

  const merged = [...crypto, ...finance]
    .filter(item => item.headline) // drop anything that came back empty
    .sort((a, b) => b.publishedAt - a.publishedAt)
    .slice(0, 12)
    .map(({ publishedAt, ...rest }) => rest); // don't leak the raw timestamp to the client

  if (merged.length === 0) {
    return NextResponse.json({ news: [], error: 'No news available right now' }, { status: 200 });
  }

  return NextResponse.json({ news: merged });
}
