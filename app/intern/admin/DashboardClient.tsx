"use client";

import { useState, useEffect } from "react";
import { FileText, Briefcase, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnimatedNumber from "@/components/AnimatedNumber";
import dayjs from "dayjs";
import "dayjs/locale/th";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
dayjs.locale("th");

type DashboardStats = {
  pendingApplicationsCount: number;
  activeInternsCount: number;
};

type DashboardListItem = {
  id: string;
  position: string;
  departmentUnit: string;
  createdAt: string;
  profile: {
    firstName: string;
    lastName: string;
    major: string;
    profilePictureUrl: string | null;
    user: {
      email: string;
    };
  };
};

type DashboardActivity = {
  id: string;
  action: string;
  title: string;
  description: string;
  date: string;
};

type DashboardClientProps = {
  adminName: string;
  stats: DashboardStats;
  recentSubmissions: DashboardListItem[];
  activeInterns: DashboardListItem[];
  activities: DashboardActivity[];
};


// ─── Skeleton ────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <tr className="border-b border-gray-50">
      {[25, 17, 30, 12, 16].map((w, i) => (
        <td key={i} className="py-4 px-2">
          <div className="h-4 rounded-md bg-gray-100 animate-pulse" style={{ width: `${w * 0.7}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function DashboardClient({
  adminName,
  stats,
  recentSubmissions,
  activeInterns,
  activities,
}: DashboardClientProps) {
  const router = useRouter();
  const [activeCard, setActiveCard] = useState<"pending" | "active">("pending");
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);
  return (
    <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col gap-8">

      {/* Header */}
      <div className="animate-fade-up delay-0">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">ยินดีต้อนรับกลับมา {adminName}</h1>
        <p className="text-sm text-gray-500 mt-1">วันนี้มี <span className="font-bold text-gray-700">{stats.pendingApplicationsCount}</span> รายการที่รอการตรวจสอบความถูกต้อง</p>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Apps */}
        <button
          onClick={() => setActiveCard("pending")}
          className={`animate-fade-up delay-100 bg-white rounded-2xl p-6 relative overflow-hidden text-left
            transition-all duration-300 ease-out
            hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98]
            ${activeCard === "pending"
              ? "border-2 border-[#10B981] shadow-[0_4px_24px_rgba(16,185,129,0.2)]"
              : "border border-gray-100 shadow-md hover:shadow-xl"
            }`}
        >
          <span className="flex justify-between items-start mb-5">
            <span className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-[#10B981] shadow-sm transition-transform duration-300 group-hover:scale-110">
              <FileText className="w-6 h-6" />
            </span>
            <AnimatedNumber value={stats.pendingApplicationsCount} duration={700} className="text-[44px] font-black text-[#10B981] leading-none tabular-nums" />
          </span>
          <span className="block font-bold text-gray-900 text-lg leading-tight">คำร้องขอรอตรวจสอบ</span>
          {activeCard === "pending" && <span className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-[#10B981] to-emerald-300" />}
        </button>

        {/* Active Interns */}
        <button
          onClick={() => setActiveCard("active")}
          className={`animate-fade-up delay-150 bg-white rounded-2xl p-6 relative overflow-hidden text-left
            transition-all duration-300 ease-out
            hover:-translate-y-1 hover:scale-[1.01] active:scale-[0.98]
            ${activeCard === "active"
              ? "border-2 border-blue-500 shadow-[0_4px_24px_rgba(59,130,246,0.2)]"
              : "border border-gray-100 shadow-md hover:shadow-xl"
            }`}
        >
          <span className="flex justify-between items-start mb-5">
            <span className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
              <Briefcase className="w-6 h-6" />
            </span>
            <AnimatedNumber value={stats.activeInternsCount} duration={900} className="text-[44px] font-black text-blue-500 leading-none tabular-nums" />
          </span>
          <span className="block font-bold text-gray-900 text-lg leading-tight">นักศึกษาที่กำลังฝึกงาน</span>
          {activeCard === "active" && <span className="absolute left-0 bottom-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-300" />}
        </button>
      </div>

      {/* Main Grid: Data Table + Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column (Table) */}
        <div className="animate-fade-up delay-200 lg:col-span-2 bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden flex flex-col items-start gap-0 p-6">
          <div className="flex justify-between items-center w-full mb-5">
            <div className="flex items-center gap-3">
              <div className={`w-1.5 h-7 rounded-full transition-colors duration-300 ${activeCard === "pending" ? "bg-[#10B981]" : "bg-blue-500"}`} />
              <h2 className="text-xl font-bold text-gray-900">
                {activeCard === "pending" ? "คำร้องขอรอการตรวจสอบ" : "นักศึกษาที่กำลังฝึกงาน"}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => router.push("/intern/admin/internships?status=PENDING")}
              className="text-sm font-bold text-[#9E76B4] hover:text-[#8A5FA0] flex items-center gap-1 transition-colors duration-200"
            >
              ดูทั้งหมด <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th style={{ width: "25%" }} className="py-3 px-2 text-[11px] font-extrabold text-gray-400 tracking-wider">ชื่อนักศึกษา</th>
                  <th style={{ width: "17%" }} className="py-3 px-2 text-[11px] font-extrabold text-gray-400 tracking-wider">สาขาวิชา</th>
                  <th style={{ width: "30%" }} className="py-3 px-2 text-[11px] font-extrabold text-gray-400 tracking-wider">ตำแหน่ง / หน่วยงาน</th>
                  <th style={{ width: "12%" }} className="py-3 px-2 text-[11px] font-extrabold text-gray-400 tracking-wider">วันที่</th>
                  <th style={{ width: "16%" }} className="py-3 px-2 text-[11px] font-extrabold text-gray-400 tracking-wider text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {!hasMounted ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : (() => {
                  const currentData = activeCard === "pending" ? recentSubmissions : activeInterns;
                  if (!currentData || currentData.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-gray-400 font-medium">ยังไม่มีข้อมูลในส่วนนี้</td>
                      </tr>
                    );
                  }
                  return currentData.map((item, idx: number) => {
                    const initials = `${item.profile.firstName?.charAt(0) || ""}${item.profile.lastName?.charAt(0) || ""}`.toUpperCase();
                    return (
                      <tr
                        key={item.id}
                        className="border-b border-gray-50 hover:bg-gray-50 transition-colors duration-200 animate-fade-up"
                        style={{ animationDelay: `${idx * 60}ms` }}
                      >
                        <td className="py-4 px-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#F5EFF9] border border-[#E5D5F0] text-[#9E76B4] font-bold rounded-full flex items-center justify-center shrink-0 text-sm shadow-sm">
                              {item.profile.profilePictureUrl ? (
                                <img src={item.profile.profilePictureUrl} className="w-full h-full rounded-full object-cover" alt="" />
                              ) : initials}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-semibold text-gray-900 truncate text-sm">{item.profile.firstName} {item.profile.lastName}</span>
                              <span className="text-[11px] text-gray-400 mt-0.5 truncate">{item.profile.user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <span className="text-sm font-medium text-gray-700 truncate block">{item.profile.major}</span>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-gray-900 truncate text-sm">{item.position}</span>
                            <span className="text-[11px] text-gray-400 mt-0.5 truncate">{item.departmentUnit}</span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <div className="flex flex-col min-w-0">
                            <span className="font-medium text-gray-700 text-[13px] truncate">
                              {dayjs(item.createdAt).fromNow()}
                            </span>
                            <span className="font-medium text-gray-400 text-[11px] truncate">
                              {dayjs(item.createdAt).format("DD MMM YYYY")}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-2">
                          <Link
                            href={`/intern/admin/internships?id=${item.id}`}
                            className="w-full flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-bold py-2 px-3 rounded-lg border border-emerald-200 transition-all duration-200 text-xs"
                          >
                            ดูรายละเอียด
                          </Link>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column (Timeline) */}
        <div className="animate-fade-up delay-250 bg-white border border-gray-100 rounded-2xl shadow-md p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#9E76B4]/10 text-[#9E76B4] rounded-xl flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" /></svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900">กิจกรรมล่าสุด</h2>
              </div>
            </div>

            <div className="relative border-l-[3px] border-gray-100 ml-4 mt-4 space-y-8 pb-4">
              {activities.length === 0 && (
                <p className="text-sm text-gray-400">ยังไม่มีกิจกรรมล่าสุด</p>
              )}

              {activities.map((act, idx: number) => {
                let dotColorClass = "bg-emerald-500 border-emerald-200 outline-emerald-100";

                if (["REJECT_DOC", "DELETE_DOC"].includes(act.action)) {
                  dotColorClass = "bg-red-500 border-red-200 outline-red-100";
                } else if (act.action === "UPDATE_INFO") {
                  dotColorClass = "bg-yellow-500 border-yellow-200 outline-yellow-100";
                }

                return (
                  <div
                    key={act.id}
                    className="relative pl-8 group transition-all duration-300 ease-out animate-fade-up"
                    style={{ animationDelay: `${250 + idx * 60}ms` }}
                  >
                    <div className={`absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 border-white outline outline-4 ${dotColorClass} z-10 transition-transform group-hover:scale-110`} />
                    <p className="text-sm font-bold text-gray-900 leading-snug">{act.title}</p>
                    <span className="text-xs font-medium text-gray-500 mt-0.5 block">{act.description}</span>
                    <span className="text-[11px] text-gray-400 mt-1 block">
                      {hasMounted ? dayjs(act.date).fromNow() : "..."}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <Link
            href="/intern/admin/activities"
            className="w-full mt-6 py-3 bg-gray-50 hover:bg-gray-100 active:scale-[0.98] border border-gray-200 text-gray-600 font-bold rounded-xl text-sm transition-all duration-200 text-center block"
          >
            View all activity logs
          </Link>
        </div>

      </div>
    </div>
  );
}
