// app/api/support/thread/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";


export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { body, ticketId } = await req.json().catch(() => ({}));
  if (!body?.trim()) return NextResponse.json({ error: "Message body is required." }, { status: 400 });

  let ticket;

  if (ticketId) {
    ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket || ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Ticket not found." }, { status: 404 });
    }
    if (ticket.status === "CLOSED") {
      ticket = await prisma.supportTicket.update({
        where: { id: ticketId },
        data:  { status: "OPEN", updatedAt: new Date() },
      });
    }
  } else {
    ticket = await prisma.supportTicket.create({
      data: {
        userId:  session.user.id,
        subject: body.slice(0, 80),
        status:  "OPEN",
      },
    });
  }

  await prisma.supportMessage.create({
    data: {
      ticketId: ticket.id,
      sender:   "USER",
      body:     body.trim(),
    },
  });

  await prisma.supportTicket.update({
    where: { id: ticket.id },
    data:  { updatedAt: new Date() },
  });

  // ── If the message is from ADMIN, notify the user ──
  // (When you build the admin reply route, call createNotification there instead.
  //  This fires if you ever call this route server-side on behalf of admin.)
  if (session.user.role === "ADMIN") {
    await createNotification(
      ticket.userId,
      "SUPPORT_MESSAGE",
      "New message from support",
      body.trim().slice(0, 120),
    );
  }

  return NextResponse.json({ ticketId: ticket.id, status: ticket.status });
}
