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

  const dbUser = await prisma.user.findUnique({ where: { email: session.user.email! } });
  const studentProfile = dbUser
    ? await prisma.studentProfile.findFirst({
      where: { userId: dbUser.id },
      select: { profilePictureUrl: true, firstNameTh: true, lastNameTh: true },
    })
    : null;
  const profilePictureUrl = studentProfile?.profilePictureUrl ?? null;
  const displayName = studentProfile?.firstNameTh ?? session.user.name;

  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full bg-gradient-to-r from-[#FF9B5C] to-[#F16422] shadow-md">
        <div className="flex items-center justify-between px-3 py-3 lg:px-8 lg:py-4">
          
          {/* Left: Hamburger + Logo + Title */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile hamburger — ก่อน logo */}
            <div className="lg:hidden">
              <NavTabs variant="dark" />
            </div>

            <Link href="/intern/student" prefetch={false} className="shrink-0 transition-opacity hover:opacity-90">
              <img src="/logo.png" alt="CMU Internship Logo" className="h-8 w-auto object-contain drop-shadow-md" />
            </Link>

            <h1 className="text-sm font-bold text-white tracking-tight lg:text-lg">
              <span className="sm:hidden">IMS</span>
              <span className="hidden sm:inline">Internship Management System</span>
            </h1>

            {/* Desktop tabs อยู่ใน row เดียวกับ logo */}
            <div className="hidden lg:block">
              <NavTabs variant="dark" />
            </div>
          </div>

          {/* Right: Profile */}
          <div className="shrink-0 ml-2">
            <ProfileDropdown 
              variant="dark" 
              user={session.user} 
              profilePictureUrl={profilePictureUrl} 
              displayName={displayName} 
            />
          </div>

        </div>
      </header>
      <main className="flex-grow w-full bg-gray-100 pb-12">{children}</main>
    </div>
  );
}