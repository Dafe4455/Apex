// lib/subscription.ts
import { prisma } from "@/lib/prisma";

export async function hasActiveAutoTradeSubscription(userId: string): Promise<boolean> {
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "active",
      plan: {
        features: { array_contains: ["auto-trading"] },
        isActive: true,
      },
    },
  });
  return !!activeSub;
}
