import React from "react";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import InternshipForm from "./InternshipForm";

export default async function InternshipPage() {
  const session = await getSession();

  if (!session?.user?.email) {
    redirect("/intern/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  if (!dbUser) redirect("/intern/login");

  const userId = dbUser.id;

  const profile = await prisma.studentProfile.findFirst({
    where: { userId },
  });

  if (!profile || !profile.firstNameTh) {
    redirect("/intern/profile?error=incomplete");
  }

  const internship = await prisma.internship.findFirst({
    where: { studentId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <InternshipForm
        initialProfile={profile}
        initialInternship={internship}
        email={session.user.email ?? null}
      />
    </React.Suspense>
  );
}
