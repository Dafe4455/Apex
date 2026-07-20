import { NextResponse } from "next/server";
import { auth } from "@root/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, email } = await req.json();

  // Split name into firstName + lastName
  let firstName, lastName;
  if (name !== undefined) {
    const parts = name.trim().split(/\s+/);
    firstName = parts[0];
    lastName = parts.slice(1).join(" ") || null;
  }

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(email !== undefined && { email }),
    },
  });

  const fullName = user.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : user.email;

  return NextResponse.json({ ok: true, name: fullName, email: user.email });
}
