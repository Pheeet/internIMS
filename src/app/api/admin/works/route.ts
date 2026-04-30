import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");

    const students = await prisma.user.findMany({
      where: {
        role: "STUDENT",
        internships: {
          some: { status: "COMPLETED" },
        },
        ...(search
          ? {
              OR: [
                {
                  studentProfile: {
                    firstNameTh: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  studentProfile: {
                    lastNameTh: { contains: search, mode: "insensitive" },
                  },
                },
                {
                  works: {
                    some: {
                      title: { contains: search, mode: "insensitive" },
                    },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        studentProfile: true,
        works: {
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        studentProfile: {
          firstNameTh: "asc",
        },
      },
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching admin works:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
