import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/support/thread
// Returns the user's single support ticket + all messages, creating the ticket if none exists.
export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ticket = await prisma.supportTicket.findFirst({
    where:   { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!ticket) {
    // No thread yet — return empty state, don't create one until first message
    return NextResponse.json({ ticketId: null, status: null, messages: [] });
  }

  return NextResponse.json({
    ticketId: ticket.id,
    status:   ticket.status,
    messages: ticket.messages.map((m) => ({
      id:        m.id,
      sender:    m.sender,
      body:      m.body,
      createdAt: m.createdAt.toISOString(),
    })),
  });
}
