"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Download, Search, Clock, ChevronDown, Users, Folder } from "lucide-react";
import dayjs from "dayjs";

// ─── Types ────────────────────────────────────────────────────────────────────
type ToneColor = "green" | "red" | "yellow" | "sky" | "violet" | "orange" | "teal" | "amber" | "cyan";
type LogGroup = "Status flow" | "Leave" | "Document" | "Info update" | "Account management" | "Export";
type ActivityLog = {
  id: string;
  action: string;
  group: LogGroup;
  toneColor: ToneColor;
  actorName: string;
  actorRole: "admin" | "student";
  targetName: string;
  targetRole: "admin" | "student";
  details: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอดำเนินการ", color: "text-yellow-600 bg-yellow-50" },
  APPROVED: { label: "อนุมัติ", color: "text-green-600 bg-green-50" },
  REJECTED: { label: "ปฏิเสธ", color: "text-red-600 bg-red-50" },
  EDIT_REQUESTED: { label: "รอการแก้ไข", color: "text-cyan-600 bg-cyan-50 border-cyan-100" },
  COMPLETED: { label: "เสร็จสิ้น", color: "text-blue-600 bg-blue-50" },
};

const TABS = [
  {
    id: "all",
    label: "ทั้งหมด",
    activeClasses: "bg-gray-200 text-gray-900 border-gray-300",
    inactiveClasses: "border-gray-200 bg-transparent text-gray-500 hover:bg-gray-50",
    dotBg: "bg-black"
  },
  {
    id: "submit",
    label: "ส่งคำร้อง",
    activeClasses: "bg-amber-100 text-amber-800 border-amber-300",
    inactiveClasses: "border-amber-100 bg-transparent text-gray-400 hover:bg-amber-50",
    dotBg: "bg-amber-500"
  },
  {
    id: "approve",
    label: "อนุมัติ",
    activeClasses: "bg-green-100 text-green-800 border-green-300",
    inactiveClasses: "border-green-100 bg-transparent text-gray-400 hover:bg-green-50",
    dotBg: "bg-green-500"
  },
  {
    id: "reject",
    label: "ตีกลับ",
    activeClasses: "bg-red-100 text-red-800 border-red-300",
    inactiveClasses: "border-red-100 bg-transparent text-gray-400 hover:bg-red-50",
    dotBg: "bg-red-500"
  },
  {
    id: "complete",
    label: "สำเร็จการฝึกงาน",
    activeClasses: "bg-violet-100 text-violet-800 border-violet-300",
    inactiveClasses: "border-violet-100 bg-transparent text-gray-400 hover:bg-violet-50",
    dotBg: "bg-violet-500"
  },
  {
    id: "update_info",
    label: "แก้ไขข้อมูล",
    activeClasses: "bg-cyan-100 text-cyan-800 border-cyan-300",
    inactiveClasses: "border-cyan-100 bg-transparent text-gray-400 hover:bg-cyan-50",
    dotBg: "bg-cyan-500"
  },
  {
    id: "add_user",
    label: "เพิ่มผู้ใช้",
    activeClasses: "bg-sky-100 text-sky-800 border-sky-300",
    inactiveClasses: "border-sky-100 bg-transparent text-gray-400 hover:bg-sky-50",
    dotBg: "bg-sky-500"
  },
  {
    id: "delete_user",
    label: "ลบผู้ใช้",
    activeClasses: "bg-orange-100 text-orange-800 border-orange-300",
    inactiveClasses: "border-orange-100 bg-transparent text-gray-400 hover:bg-orange-50",
    dotBg: "bg-orange-500"
  },
];



const toneColorDotClasses: Record<ToneColor, string> = {
  green: "bg-green-500 border-green-200 outline-green-100",
  red: "bg-red-500 border-red-200 outline-red-100",
  yellow: "bg-amber-400 border-amber-200 outline-amber-100",
  sky: "bg-sky-500 border-sky-200 outline-sky-100",
  violet: "bg-violet-500 border-violet-200 outline-violet-100",
  orange: "bg-orange-500 border-orange-200 outline-orange-100",
  teal: "bg-teal-500 border-teal-200 outline-teal-100",
  amber: "bg-amber-500 border-amber-200 outline-amber-100",
  cyan: "bg-cyan-500 border-cyan-200 outline-cyan-100",
};

const actionLabels: Record<string, { label: string; description: string }> = {
  USER_ADDED: { label: "เพิ่มผู้ใช้", description: "เพิ่ม {role} ใหม่" },
  USER_DELETED: { label: "ลบผู้ใช้", description: "ลบ {role} ออกจากระบบ" },
  PASSWORD_RESET: { label: "รีเซ็ตรหัสผ่าน", description: "รีเซ็ตรหัสผ่านให้ {target}" },
  STATUS_CHANGED: { label: "เปลี่ยนสถานะ", description: "เปลี่ยนสถานะการฝึกงาน" },
  UPDATE_INFO: { label: "แก้ไขข้อมูล", description: "แก้ไขข้อมูลการฝึกงาน" },
  SUBMIT: { label: "ส่งข้อมูล", description: "ส่งข้อมูลฝึกงานครั้งแรก" },
  RESUBMIT: { label: "แก้ไขเอกสาร", description: "นักศึกษามีการแก้ไขเอกสารและส่งใหม่" },
  RE_UPLOAD_DOC: { label: "อัปโหลดเอกสาร", description: "อัปโหลดเอกสารใหม่" },
  // Keep legacy labels for backward compatibility
  "SUBMIT_DOC": { label: "ส่งคำร้องขอฝึกงาน", description: "ส่งคำร้องขอฝึกงาน" },
  "FLAG_FIELDS": { label: "ส่งกลับให้แก้ไข (ถูกตีกลับ)", description: "ส่งกลับให้แก้ไข" },
  "STUDENT_RESUBMIT": { label: "นักศึกษาแก้ไขแล้วส่งใหม่", description: "ส่งข้อมูลหลังแก้ไข" },
  "APPROVE_DOC": { label: "อนุมัติคำร้อง", description: "อนุมัติคำร้อง" },
  "RE_APPROVE_DOC": { label: "อนุมัติหลังแก้ไข", description: "อนุมัติหลังแก้ไข" },
  "MARK_COMPLETED": { label: "เปลี่ยนสถานะเป็นจบการฝึกงาน", description: "เปลี่ยนสถานะเป็นจบการฝึกงาน" },
  "SUBMIT_LEAVE": { label: "ยื่นใบลา", description: "ยื่นใบลา" },
  "APPROVE_LEAVE": { label: "อนุมัติใบลา", description: "อนุมัติใบลา" },
  "REJECT_LEAVE": { label: "ไม่อนุมัติใบลา", description: "ไม่อนุมัติใบลา" },
  "DELETE_DOC": { label: "ลบเอกสาร", description: "ลบเอกสาร" },
  "UPDATE_PROFILE": { label: "นักศึกษาอัปเดตโปรไฟล์", description: "นักศึกษาอัปเดตโปรไฟล์" },
  "CHANGE_PASSWORD": { label: "เปลี่ยนรหัสผ่าน", description: "เปลี่ยนรหัสผ่าน" },
  "ADD_STUDENT": { label: "เพิ่มนักศึกษาใหม่", description: "เพิ่มนักศึกษาใหม่" },
  "ASSIGN_ADMIN": { label: "เพิ่มสิทธิ์ Admin", description: "เพิ่มสิทธิ์ Admin" },
  "REVOKE_ADMIN": { label: "ถอดสิทธิ์ Admin", description: "ถอดสิทธิ์ Admin" },
  "DEACTIVATE_USER": { label: "ระงับบัญชีผู้ใช้", description: "ระงับบัญชีผู้ใช้" },
  "EXPORT": { label: "นำออกข้อมูล", description: "นำออกข้อมูล" },
};

export default function ActivitiesClient() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState<string>("all");


  useEffect(() => {
    async function loadLogs() {
      try {
        const response = await fetch("/api/admin/activities", { cache: "no-store" });
        if (!response.ok) {
          setLogs([]);
          return;
        }

        const data = (await response.json()) as { logs?: ActivityLog[] };
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      } catch {
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    }

    void loadLogs();
  }, []);



  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        log.actorName.toLowerCase().includes(q) ||
        log.targetName.toLowerCase().includes(q) ||
        (actionLabels[log.action]?.label ?? log.action).toLowerCase().includes(q);

      const matchesTab = selectedTab === "all" || (
        selectedTab === "update_info" ? (log.action === "UPDATE_INFO" || log.action === "UPDATE_PROFILE" || log.newValue === "EDIT_REQUESTED") :
          selectedTab === "submit" ? (log.action === "SUBMIT" || (log.newValue === "PENDING" && log.action !== "STATUS_CHANGED") || (log.action === "STATUS_CHANGED" && log.newValue === "PENDING")) :
            selectedTab === "approve" ? (log.action === "STATUS_CHANGED" && log.newValue === "APPROVED") :
              selectedTab === "reject" ? (log.action === "STATUS_CHANGED" && log.newValue === "REJECTED") :
                selectedTab === "complete" ? (log.action === "STATUS_CHANGED" && log.newValue === "COMPLETED") :
                  selectedTab === "add_user" ? (log.action === "USER_ADDED") :
                    selectedTab === "delete_user" ? (log.action === "USER_DELETED") :
                      false
      );

      return matchesSearch && matchesTab;
    });
  }, [logs, searchQuery, selectedTab]);

  const handleExport = () => {
    const headers = ["วันเวลา", "ประเภทการกระทำ", "ผู้ดำเนินการ", "เป้าหมาย", "รายละเอียด"];
    const rows = filteredLogs.map((log) => [
      dayjs(log.createdAt).format("YYYY-MM-DD HH:mm:ss"),
      log.action,
      `"${log.actorName}"`,
      `"${log.targetName}"`,
      `"${log.details || ""}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map((e) => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `activity_logs_${dayjs().format("YYYYMMDD")}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };



  return (
    <div className="w-full max-w-[1200px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col gap-6">

      {/* Header */}
      <div className="animate-fade-up delay-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">ประวัติการทำงานของระบบ</h1>
          <p className="text-sm text-gray-500 mt-1">ตรวจสอบและติดตามประวัติการดำเนินการทั้งหมด</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="animate-fade-up delay-100 bg-white border border-gray-100 rounded-2xl shadow-md p-4 flex flex-col gap-3 w-full">

        {/* Row 1: Search + Dropdowns + Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อผู้ใช้หรือประเภทการกระทำ..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-[#9E76B4] focus:ring-1 focus:ring-[#9E76B4] outline-none transition-all text-gray-900 h-[44px]"
            />
          </div>


          <button
            onClick={handleExport}
            className="flex items-center gap-2 bg-[#9E76B4] text-white px-5 py-2.5 rounded-xl font-extrabold hover:bg-[#8A5FA0] hover:shadow-lg active:scale-95 transition-all duration-300 ease-out h-[44px] whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> ส่งออกรายงาน
          </button>
        </div>

        {/* Row 2: Activity Tabs */}
        <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-gray-50">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">หมวดหมู่:</span>
          {TABS.map(({ id, label, dotBg, activeClasses, inactiveClasses }) => {
            const isActive = selectedTab === id;
            return (
              <button
                key={id}
                onClick={() => setSelectedTab(id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold border-2 transition-all duration-200 ${isActive
                    ? `${activeClasses} shadow-sm`
                    : `${inactiveClasses}`
                  }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dotBg} transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                <span>{label}</span>
              </button>
            );
          })}

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="ml-auto px-3 py-1 rounded-lg text-xs font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-all whitespace-nowrap"
            >
              ล้างการค้นหา
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="animate-fade-up delay-200 bg-white border border-gray-100 rounded-2xl shadow-md p-6 sm:p-10 min-h-[500px]">
        {isLoading ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400 font-medium text-center">
            <Clock className="w-12 h-12 text-gray-200 mb-4 animate-pulse" />
            <p className="text-lg">กำลังโหลดกิจกรรม...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="w-full py-20 flex flex-col items-center justify-center text-gray-400 font-medium text-center">
            <Clock className="w-12 h-12 text-gray-200 mb-4" />
            <p className="text-lg">ไม่พบข้อมูลกิจกรรมที่ตรงกับเงื่อนไข</p>
            <p className="text-sm mt-1">ลองปรับเปลี่ยนเงื่อนไขการค้นหา</p>
          </div>
        ) : (
          <div className="relative border-l-[3px] border-gray-100 ml-4 sm:ml-8 mt-4 space-y-10 pb-10">
            {filteredLogs.map((log, idx) => {
              const dotClass = toneColorDotClasses[log.toneColor];
              const actionConfig = actionLabels[log.action];
              const showDetail = (log.action.includes("REJECT") || log.action === "FLAG_FIELDS") && log.details;
              const isStatusChanged = (log.action === "STATUS_CHANGED" || log.action === "RESUBMIT") && log.oldValue && log.newValue;

              return (
                <div key={log.id} className="relative pl-8 sm:pl-12 group transition-all duration-300 ease-out animate-fade-up" style={{ animationDelay: `${200 + idx * 60}ms` }}>
                  <div className={`absolute -left-[10.5px] top-1.5 w-5 h-5 rounded-full border-4 border-white outline outline-4 ${dotClass} z-10 transition-transform group-hover:scale-110`} />

                  {isStatusChanged ? (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {log.action === "STATUS_CHANGED" && log.oldValue === "PENDING" && log.newValue === "APPROVED"
                              ? "ยอมรับเข้าฝึกงาน"
                              : log.action === "STATUS_CHANGED" && log.newValue === "REJECTED"
                              ? "ปฏิเสธเอกสาร"
                              : log.action === "STATUS_CHANGED" && log.oldValue === "EDIT_REQUESTED" && log.newValue === "APPROVED"
                              ? "แอดมินยอมรับการแก้ไข"
                              : log.action === "STATUS_CHANGED" && log.oldValue === "APPROVED" && log.newValue === "COMPLETED"
                              ? "สำเร็จการฝึกงาน"
                              : (actionConfig?.label ?? log.action)}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-purple-600 font-medium">{log.targetName}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${log.oldValue && STATUS_LABELS[log.oldValue] ? STATUS_LABELS[log.oldValue].color : "text-gray-600 bg-gray-50"}`}>
                            {log.oldValue && STATUS_LABELS[log.oldValue] ? STATUS_LABELS[log.oldValue].label : log.oldValue}
                          </span>
                          <span className="text-gray-400 text-xs font-medium">→</span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${log.newValue && STATUS_LABELS[log.newValue] ? STATUS_LABELS[log.newValue].color : "text-gray-600 bg-gray-50"}`}>
                            {log.newValue && STATUS_LABELS[log.newValue] ? STATUS_LABELS[log.newValue].label : log.newValue}
                          </span>
                          <span className="text-sm text-gray-500 ml-1">
                            {" โดย "}
                            <span className="text-purple-400 font-medium">{log.actorName}</span>
                            {log.actorRole && (
                              <span className="text-gray-400">
                                {" "}({log.actorRole === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา"})
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                      <time className="text-[13px] font-bold text-gray-400 shrink-0">
                        {dayjs(log.createdAt).format("MMM DD, YYYY • HH:mm:ss")}
                      </time>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 sm:gap-8">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-800">
                            {actionConfig?.label ?? log.action}
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-purple-600 font-medium">{log.targetName}</span>
                        </div>
                        <div className="text-sm text-gray-500 mt-0.5">
                          {(actionLabels[log.action]?.description || log.details || log.action)
                            .replace("{role}", log.targetRole === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา")
                            .replace("{target}", log.targetName)}
                          {log.actorName && (
                            <>
                              {" โดย "}
                              <span className="text-purple-500 font-medium">{log.actorName}</span>
                              {log.actorRole && (
                                <span className="text-gray-400">
                                  {" "}({log.actorRole === "admin" ? "ผู้ดูแลระบบ" : "นักศึกษา"})
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                      <time className="text-[13px] font-bold text-gray-400 shrink-0">
                        {dayjs(log.createdAt).format("MMM DD, YYYY • HH:mm:ss")}
                      </time>
                    </div>
                  )}

                  {showDetail && (
                    <div className="mt-4 bg-red-50/50 border border-red-100 rounded-xl p-4 relative">
                      <div className="absolute -top-2 left-6 w-4 h-4 bg-red-50/50 border-t border-l border-red-100 rotate-45" />
                      <p className="text-sm font-medium text-red-700 z-10 relative">
                        <span className="font-bold flex items-center gap-1.5 mb-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          เหตุผล
                        </span>
                        {log.details}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

