"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

interface NavTab {
  label: string;
  href: string;
}

const studentTabs: NavTab[] = [
  { label: "ภาพรวม", href: "/intern/student" },
  { label: "ข้อมูลส่วนตัว", href: "/intern/student/profile" },
  { label: "ผลงานนักศึกษา", href: "/intern/student/works" },
  { label: "จัดการเอกสารฝึกงาน", href: "/intern/student/internship-form" },
];

const adminTabs: NavTab[] = [
  { label: "ภาพรวม", href: "/intern/admin" },
  { label: "จัดการการฝึกงาน", href: "/intern/admin/internships" },
  { label: "ผลงานนักศึกษา", href: "/intern/admin/works" },
  { label: "บันทึกการทำงาน", href: "/intern/admin/activities" },
  { label: "จัดการระบบ", href: "/intern/admin/management" },
];

export default function NavTabs({ variant = "light", userRole = "" }: { variant?: "light" | "dark"; userRole?: string }) {
  const pathname = usePathname();

  const isAdmin = pathname.startsWith("/intern/admin");
  const tabs = isAdmin ? adminTabs : studentTabs;

  const isDark = variant === "dark";

  return (
    <nav className="flex items-center gap-1">
      {tabs.map((tab) => {
        const isActive = (() => {
          // Exact match for dashboard routes
          if (tab.href === "/intern/admin") return pathname === "/intern/admin" || pathname === "/intern/admin/";
          if (tab.href === "/intern/student") return pathname === "/intern/student" || pathname === "/intern/student/";
          // Prefix match for all other routes
          // Prefix match for all other routes
          if (pathname === tab.href || pathname.startsWith(tab.href + "/")) return true;
          // Support legacy paths for active state
          if (tab.href === "/intern/student/profile" && pathname.startsWith("/intern/profile")) return true;
          if (tab.href === "/intern/student/internship-form" && pathname.startsWith("/intern/internship")) return true;
          return false;
        })();

        return (
          <Link
            key={tab.href}
            href={tab.href}
            prefetch={false}
            className={`
              relative px-4 py-2 text-sm font-semibold rounded-lg transition-colors duration-200
              ${isActive
                ? "text-white"
                : isDark
                  ? "text-white/80 hover:text-white"
                  : "text-gray-600 hover:text-gray-900"
              }
            `}
          >
            {isActive && (
              <motion.div
                layoutId="nav-active-pill"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-0 z-0 bg-white/20 rounded-lg"
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
