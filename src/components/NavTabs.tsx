"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Menu, X } from "lucide-react";

interface NavTab {
  label: string;
  href: string;
}

const studentTabs: NavTab[] = [
  { label: "ภาพรวม", href: "/intern/student" },
  { label: "ข้อมูลส่วนตัว", href: "/intern/student/profile" },
  { label: "จัดการเอกสารฝึกงาน", href: "/intern/student/internship-form" },
];

const adminTabs: NavTab[] = [
  { label: "ภาพรวม", href: "/intern/admin" },
  { label: "จัดการการฝึกงาน", href: "/intern/admin/internships" },
  { label: "บันทึกการทำงาน", href: "/intern/admin/activities" },
  { label: "จัดการระบบ", href: "/intern/admin/management" },
];

export default function NavTabs({ variant = "light", userRole = "" }: { variant?: "light" | "dark"; userRole?: string }) {
  const pathname = usePathname();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdmin = pathname.startsWith("/intern/admin");
  const tabs = isAdmin ? adminTabs : studentTabs;
  const isDark = variant === "dark";

  // Helper to check if a tab is active
  const checkIsActive = (href: string) => {
    if (href === "/intern/admin") return pathname === "/intern/admin" || pathname === "/intern/admin/";
    if (href === "/intern/student") return pathname === "/intern/student" || pathname === "/intern/student/";
    if (pathname === href || pathname.startsWith(href + "/")) return true;
    if (href === "/intern/student/profile" && pathname.startsWith("/intern/profile")) return true;
    if (href === "/intern/student/internship-form" && pathname.startsWith("/intern/internship")) return true;
    return false;
  };

  const activeTab = tabs.find(tab => checkIsActive(tab.href)) || tabs[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [pathname]);

  return (
    <div className="relative py-1">
      {/* --- Mobile Sidebar (visible below lg) --- */}
      <div className="lg:hidden" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(true)}
          className={`
            p-2 rounded-xl transition-all
            ${isDark 
              ? "bg-white/20 text-white border border-white/30 active:bg-white/30" 
              : "bg-white text-gray-900 border border-gray-200 shadow-sm active:bg-gray-50"
            }
          `}
        >
          <Menu className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {isDropdownOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDropdownOpen(false)}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
              />

              {/* Sheet */}
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-[82%] z-[100] shadow-2xl flex flex-col bg-white text-gray-900"
              >
                {/* Sheet Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400">เมนู</span>
                    <span className="text-sm font-bold truncate max-w-[180px] text-gray-900">{activeTab.label}</span>
                  </div>
                  <button 
                    onClick={() => setIsDropdownOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Sheet Links */}
                <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
                  {tabs.map((tab) => {
                    const isActive = checkIsActive(tab.href);
                    return (
                      <Link
                        key={tab.href}
                        href={tab.href}
                        prefetch={false}
                        className={`
                          group relative flex items-center gap-3 px-4 py-3.5 text-sm font-semibold rounded-xl transition-all
                          ${isActive 
                            ? "bg-[#FFF5F0] text-[#F16422]"
                            : "text-gray-600 hover:bg-gray-50"
                          }
                        `}
                      >
                        {isActive && (
                          <motion.div 
                            layoutId="mobile-active-dot"
                            className="w-1.5 h-1.5 rounded-full bg-[#F16422] shadow-[0_0_8px_rgba(241,100,34,0.6)]" 
                          />
                        )}
                        <span className={isActive ? "translate-x-0" : "group-hover:translate-x-1 transition-transform"}>
                          {tab.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* --- Desktop Tabs (visible lg and above) --- */}
      <nav className="hidden lg:flex items-center gap-1">
        {tabs.map((tab) => {
          const isActive = checkIsActive(tab.href);
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
    </div>
  );
}
