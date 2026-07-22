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
