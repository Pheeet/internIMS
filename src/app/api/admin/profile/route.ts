import { NextResponse } from "next/server";
import { requireAdminUser } from "@/src/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request) {
  try {
    const user = await requireAdminUser();

    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Split name into first/last — take first word as firstName, rest as lastName
    const parts = name.trim().split(" ");
    const firstNameTh = parts[0] ?? "";
    const lastNameTh = parts.slice(1).join(" ") || "";

    await prisma.adminProfile.upsert({
      where: { userId: user.id },
      update: { firstNameTh, lastNameTh },
      create: { userId: user.id, firstNameTh, lastNameTh },
    });

    return NextResponse.json({ success: true, name: name.trim() });
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json({ error: error.message }, { status: error.message.includes("Unauthorized") ? 401 : 403 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
