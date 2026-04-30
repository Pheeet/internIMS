import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";

    if (query.length < 2) {
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
  } catch (error) {
    console.error("Error searching students:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
