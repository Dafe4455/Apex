// app/api/subscriptions/activate/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { planId } = await req.json();
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } });

  if (!user || !plan || !plan.isActive) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  if (user.portfolioBalance < plan.price) return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });

  // Deduct balance & create transaction
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
    prisma.subscription.create({
      data: {
        userId: user.id,
        planId: plan.id,
        status: "active",
        startDate: new Date(),
        currentPeriodStart: new Date(),
        currentPeriodEnd: calculatePeriodEnd(new Date(), plan.interval),
        nextBillingDate: calculatePeriodEnd(new Date(), plan.interval),
        autoRenew: true,
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}

function calculatePeriodEnd(start: Date, interval: string): Date {
  const date = new Date(start);
  if (interval === "MONTHLY") date.setMonth(date.getMonth() + 1);
  else if (interval === "YEARLY") date.setFullYear(date.getFullYear() + 1);
  return date;
}
