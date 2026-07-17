// app/api/cron/renew-subscriptions/route.ts
import { prisma } from "@/lib/prisma";
import { calculatePeriodEnd } from "@/lib/dates";

export async function GET(req: Request) {
  // Verify cron secret (set in env)
  if (req.headers.get("Authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("Unauthorized", { status: 401 });

  const now = new Date();
  const dueSubscriptions = await prisma.subscription.findMany({
    where: {
      status: "active",
      nextBillingDate: { lte: now },
      autoRenew: true,
    },
    include: { user: true, plan: true },
  });

  for (const sub of dueSubscriptions) {
    const { user, plan } = sub;
    if (user.portfolioBalance >= plan.price) {
      await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { portfolioBalance: { decrement: plan.price } } }),
        prisma.transaction.create({
          data: {
            type: "SubscriptionFee",
            amount: plan.price,
            userId: user.id,
            status: "COMPLETED",
          },
        }),
        prisma.subscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: now,
            currentPeriodEnd: calculatePeriodEnd(now, plan.interval),
            nextBillingDate: calculatePeriodEnd(now, plan.interval),
          },
        }),
      ]);
    } else {
      // Not enough balance – cancel or expire
      await prisma.subscription.update({
        where: { id: sub.id },
        data: { status: "cancelled", autoRenew: false },
      });
      // Optionally send a notification to the user
    }
  }

  return Response.json({ processed: dueSubscriptions.length });
}

// copy the calculatePeriodEnd helper from above
