import React from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import ProfileForm from "./ProfileForm";
import { redirect } from "next/navigation";

export default async function StudentProfilePage() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/intern/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) redirect("/intern/login");

  try {
    const profile = await prisma.studentProfile.findFirst({
      where: { userId: dbUser.id },
    });

    return (
      <React.Suspense fallback={<div>Loading...</div>}>
        <ProfileForm initialData={profile} email={session.user.email} />
      </React.Suspense>
    );
  } catch (error) {
    console.error("Failed to fetch student profile:", error);
    return <ProfileForm initialData={null} email={session.user.email} />;
  }
}
