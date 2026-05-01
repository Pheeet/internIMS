"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Pencil, LogOut, User } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/session";

interface ProfileDropdownProps {
  variant?: "light" | "dark";
  user: SessionUser;
  profilePictureUrl?: string | null;
  displayName?: string;
}

export default function ProfileDropdown({ variant = "light", user, profilePictureUrl, displayName: overrideName }: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newName, setNewName] = useState(user.name);
  const [savedName, setSavedName] = useState<string | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDark = variant === "dark";

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = (savedName ?? overrideName ?? user.name)?.split(" ")[0];
  const displayEmail = user.email;
  const role = user.role.toLowerCase();
  const displayRole = role === "admin" || role === "super_admin" ? "ผู้ดูแลระบบ" : "นักศึกษา";

  const fallbackAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayEmail)}&backgroundColor=b6e3f4`;
  const avatarSrc = profilePictureUrl || fallbackAvatar;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-4 focus:outline-none transition-opacity hover:opacity-90"
      >
        <div className="hidden sm:flex flex-col items-end min-w-0">
          <span suppressHydrationWarning className={`text-base font-bold truncate max-w-[150px] ${isDark ? "text-white" : "text-gray-900"}`}>
            {hasMounted ? displayName : ""}
          </span>
          <span suppressHydrationWarning className={`text-xs font-bold tracking-wide ${isDark ? "text-white/80" : "text-[#E84E1B]"}`}>
            {hasMounted ? displayRole : ""}
          </span>
        </div>
        <div className={`h-11 w-11 overflow-hidden rounded-full border-2 shadow-sm bg-gray-100 ${isDark ? "border-white/30" : "border-gray-100"}`}>
          <img src={avatarSrc} alt="User Avatar" className="h-full w-full object-cover" />
        </div>
      </button>

      {/* Dropdown */}
      <div
        className={`absolute -right-2 mt-[14px] w-80 rounded-[1.25rem] bg-white p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] ring-1 ring-gray-200 ring-opacity-5 z-50 origin-top-right
          transition-all duration-200
          ${isOpen ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 -translate-y-2.5 pointer-events-none"}`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-4 py-3.5">
          <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gray-100 shadow-sm">
            <img src={avatarSrc} alt="User Avatar" className="h-full w-full object-cover" />
          </div>
          <div className="flex flex-col min-w-0 pt-0.5">
            <span className="text-[15px] font-bold text-gray-900 leading-tight truncate">{displayName}</span>
            <span className="text-xs text-gray-500 mt-0.5 font-medium truncate">{displayEmail}</span>
            <span className="mt-1.5 inline-flex w-fit items-center rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
              {displayRole}
            </span>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Settings section */}
        <div className="py-1.5 px-1.5">
          {/* Personal Profile (student only) */}
          {role === "student" && (
            <Link
              href="/intern/student/profile"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User size={15} className="text-gray-400" />
              ข้อมูลส่วนตัว
            </Link>
          )}

          {/* Edit name (admin only) */}
          {(role === "admin" || role === "super_admin") && (
            <>
              {isEditing ? (
                <div className="flex flex-col gap-2 px-3 py-2.5">
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:border-[#9E76B4] outline-none font-medium"
                    placeholder="Enter new name..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (!newName.trim()) return;
                        setIsSaving(true);
                        try {
                          const res = await fetch("/api/admin/profile", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newName.trim() }),
                          });
                          if (res.ok) {
                            setSavedName(newName.trim());
                          }
                        } finally {
                          setIsSaving(false);
                          setIsEditing(false);
                        }
                      }}
                      disabled={isSaving}
                      className="flex-1 py-2 text-sm font-bold text-white bg-[#9E76B4] rounded-lg hover:bg-[#8a62a0] transition-colors disabled:opacity-60"
                    >
                      {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                    </button>
                    <button
                      onClick={() => { setIsEditing(false); setNewName(user.name); }}
                      className="flex-1 py-2 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={15} className="text-gray-400" />
                  แก้ไขชื่อ
                </button>
              )}
            </>
          )}

        </div>

        <hr className="border-gray-100" />

        {/* Logout */}
        <div className="py-1.5 px-1.5">
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
            >
              <LogOut size={15} />
              ออกจากระบบ
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
