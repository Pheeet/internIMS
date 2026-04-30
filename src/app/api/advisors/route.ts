import { NextResponse } from "next/server";
import { ADVISORS } from "@/data/projects";

export async function GET() {
  return NextResponse.json(ADVISORS);
}
