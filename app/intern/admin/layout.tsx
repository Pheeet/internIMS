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
      <header className="flex w-full items-center justify-between bg-gradient-to-r from-[#C4A0D4] to-[#9E76B4] px-8 py-3 shadow-md">
        <div className="flex items-center gap-6">
          <Link href="/intern/admin" prefetch={false} className="flex items-center gap-3 transition-opacity hover:opacity-90">
            <img
              src="/logo.png"
              alt="CMU Internship Logo"
              className="h-10 w-auto object-contain drop-shadow-md"

            />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Internship Management System
            </h1>
          </Link>
          <NavTabs variant="dark" userRole={role} />
        </div>
        <ProfileDropdown variant="dark" user={session.user} />
      </header>
      <main className="flex-grow w-full bg-gray-100 pb-12">{children}</main>
    </div>
  );
}
