import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { requireAdminUser } from "@/src/lib/auth";

/**
 * Archive student search endpoint.
 * Currently under development and NOT used in the current UI.
 * Restricted to ADMIN and SUPER_ADMIN roles.
 */
export async function GET(request: Request) {
  try {
    // Verify admin role via database check
    await requireAdminUser();

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2 || query.length > 100) {
      return NextResponse.json([]);
    }

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        OR: [
          {
            studentProfile: {
              firstNameTh: { contains: query, mode: "insensitive" },
            },
          },
          {
            studentProfile: {
              lastNameTh: { contains: query, mode: "insensitive" },
            },
          },
        ],
      },
      include: {
        studentProfile: true,
      },
      take: 10,
    });

    const result = students.map((s) => {
      const profile = s.studentProfile;
      const name = profile 
        ? `${profile.prefix} ${profile.firstNameTh} ${profile.lastNameTh}`.trim()
        : s.email;
      return { id: s.id, name };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message?.includes("Unauthorized") || error.message?.includes("Forbidden")) {
      return NextResponse.json(
        { error: error.message.includes("Unauthorized") ? "Unauthorized" : "Forbidden" },
        { status: error.message.includes("Unauthorized") ? 401 : 403 }
      );
    }
    console.error("Error searching students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
