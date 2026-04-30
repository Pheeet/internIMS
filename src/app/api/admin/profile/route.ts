import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.user.role?.toUpperCase();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name } = await req.json();
  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Split name into first/last — take first word as firstName, rest as lastName
  const parts = name.trim().split(" ");
  const firstNameTh = parts[0] ?? "";
  const lastNameTh = parts.slice(1).join(" ") || "";

  await prisma.adminProfile.upsert({
    where: { userId: dbUser.id },
    update: { firstNameTh, lastNameTh },
    create: { userId: dbUser.id, firstNameTh, lastNameTh },
  });

  return NextResponse.json({ success: true, name: name.trim() });
}
