import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import NavTabs from "@/components/NavTabs";
import ProfileDropdown from "@/components/ProfileDropdown";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/intern/login");
  const role = session.user?.role?.toUpperCase();
  if (role !== "STUDENT") redirect("/intern/admin");

  // Fetch profile picture from DB
  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email! } });
  const studentProfile = dbUser ? await prisma.studentProfile.findFirst({ where: { userId: dbUser.id }, select: { profilePictureUrl: true, firstNameTh: true, lastNameTh: true } }) : null;
  const profilePictureUrl = studentProfile?.profilePictureUrl ?? null;
  const displayName = studentProfile?.firstNameTh && studentProfile?.lastNameTh
    ? `${studentProfile.firstNameTh} ${studentProfile.lastNameTh}`
    : session.user.name;
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex w-full items-center justify-between bg-gradient-to-r from-[#FF9B5C] to-[#F16422] px-8 py-3 shadow-md">
        <div className="flex items-center gap-6">
          <Link href="/intern/student" prefetch={false} className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/logo.png"
              alt="CMU Internship Logo"
              className="h-10 w-auto object-contain drop-shadow-md"
            />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Internship Management System
            </h1>
          </Link>
          <NavTabs variant="dark" />
        </div>
        <ProfileDropdown variant="dark" user={session.user} profilePictureUrl={profilePictureUrl} displayName={displayName} />
      </header>
      <main className="flex-grow w-full bg-gray-100 pb-12">{children}</main>
    </div>
  );
}
