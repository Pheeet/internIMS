import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { getCurrentUser } from "@/src/lib/session";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Refetch only the specific flags if not already in getCurrentUser select
  const userWithFlags = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      is_first_login: true,
      profile_completed: true,
      internship_submitted: true,
      role: true,
    },
  });

  if (!userWithFlags) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(userWithFlags);
}
