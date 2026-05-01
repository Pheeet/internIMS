import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import NavTabs from "@/components/NavTabs";
import ProfileDropdown from "@/components/ProfileDropdown";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/intern/login");
  const role = session.user?.role?.toUpperCase();
  if (role !== "ADMIN" && role !== "SUPER_ADMIN") redirect("/intern/student");
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full bg-gradient-to-r from-[#C4A0D4] to-[#9E76B4] shadow-md">
        <div className="flex items-center justify-between px-3 py-3 lg:px-8 lg:py-4">
          
          <div className="flex items-center gap-2 min-w-0">
            <div className="lg:hidden">
              <NavTabs variant="dark" userRole={role} />
            </div>

            <Link href="/intern/admin" prefetch={false} className="shrink-0 transition-opacity hover:opacity-90">
              <img
                src="/logo.png"
                alt="CMU Internship Logo"
                className="h-8 w-auto object-contain drop-shadow-md"
              />
            </Link>

            <h1 className="text-sm font-bold text-white tracking-tight lg:text-lg">
              <span className="sm:hidden">IMS</span>
              <span className="hidden sm:inline">Internship Management System</span>
            </h1>

            <div className="hidden lg:block">
              <NavTabs variant="dark" userRole={role} />
            </div>
          </div>

          <div className="shrink-0 ml-2">
            <ProfileDropdown variant="dark" user={session.user} />
          </div>
        </div>
      </header>
      <main className="flex-grow w-full bg-gray-100 pb-12">{children}</main>
    </div>
  );
}
