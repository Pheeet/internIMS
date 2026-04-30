import React from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";

export default async function StudentProfileSetupPage() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/intern/login");
  }

  // Fetch user by email to be 100% sure we have the right DB ID
  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      internships: {
        select: { status: true }
      }
    }
  });

  if (!dbUser) redirect("/intern/login");

  const isLocked = dbUser.internships.some(i => i.status === "COMPLETED");

  try {
    const profile = await prisma.studentProfile.findFirst({
      where: { userId: dbUser.id },
    });

    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <ProfileForm initialData={profile} email={session.user.email} isLocked={isLocked} />
      </React.Suspense>
    );
  } catch (error) {
    console.error("Failed to fetch student profile:", error);
    return <ProfileForm initialData={null} email={session.user.email} isLocked={false} />;
  }
}
