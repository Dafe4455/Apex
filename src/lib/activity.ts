// lib/activity.ts
import { prisma } from '@/lib/prisma';

export async function logActivity({
  userId,
  type,
  description,
  detail,
  metadata,
}: {
  userId: string;
  type: 'TRADE' | 'DEPOSIT' | 'WITHDRAWAL' | 'KYC' | 'SUBSCRIPTION' | 'BOT' | 'SYSTEM' | 'OTHER';
  description: string;
  detail?: string;
  metadata?: Record<string, unknown>;
}) {
  return prisma.activityLog.create({
    data: {
      userId,
      type,
      description,
      detail,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
    },
  });
}

// Usage in trade execution:
await logActivity({
  userId,
  type: 'TRADE',
  description: `SELL BTC`,
  detail: `$6,000 @ $66,247`,
  metadata: { symbol: 'BTC', side: 'SELL', amount: 6000, price: 66247 },
});
