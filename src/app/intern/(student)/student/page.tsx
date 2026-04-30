"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/th";

dayjs.extend(relativeTime);
dayjs.locale("th");
import { CheckCircle, XCircle, Clock, Hourglass, Lock, FileText, ArrowRight, AlertCircle, GraduationCap, CheckCircle2 } from "lucide-react";

type StudentFile = {
  id: string;
  fileName: string;
  status: "APPROVED" | "PENDING" | "REJECTED";
  rejectReason: string | null;
};

type StudentInternship = {
  id: string;
  internshipStatus: string;
  position: string;
  departmentUnit: string;
  startDate: string;
  endDate: string;
  supervisorName: string | null;
  rejectReason: string | null;
};

type StudentProfile = {
  firstName: string;
  lastName: string;
  phone: string;
  parentPhone: string;
  faculty: string;
  major: string;
  educationLevel: string;
  institution: string;
  guardianRelationship: string;
  files: StudentFile[];
  internship: StudentInternship | null;
  user: { email: string };
  leaveRequests: unknown[];
};

type StudentActivity = {
  id: string;
  action: string;
  description: string;
  createdAt: string;
  toneColor?: string;
  oldValue?: string | null;
  newValue?: string | null;
};

type StudentDashboardResponse = {
  profile: StudentProfile;
  recentActivities: StudentActivity[];
};

const actionLabel: Record<string, string> = {
  "SUBMIT_DOC": "ส่งเอกสารฝึกงาน",
  "RE_UPLOAD_DOC": "อัปโหลดเอกสารใหม่",
  "DELETE_DOC": "ลบเอกสาร",
  "APPROVE_DOC": "อนุมัติเอกสาร",
  "REJECT_DOC": "ตีกลับเอกสาร",
  "SUBMIT_LEAVE": "ยื่นใบลา",
  "APPROVE_LEAVE": "อนุมัติใบลา",
  "REJECT_LEAVE": "ไม่อนุมัติใบลา",
  "UPDATE_INFO": "แก้ไขข้อมูล",
  "SUBMIT": "ส่งแบบฟอร์มฝึกงาน",
  "RESUBMIT": "แก้ไขเอกสาร",
  "STATUS_CHANGED": "เปลี่ยนสถานะ",
  "APPROVE_INTERN": "ยอมรับเข้าฝึกงาน",
  "REJECT_INTERN": "เอกสารถูกตีกลับ",
  "USER_ADDED": "เพิ่มผู้ใช้งาน",
};

const statusLabel: Record<string, string> = {
  PENDING: "รอดำเนินการ",
  APPROVED: "อนุมัติ",
  REJECTED: "ถูกตีกลับ",
  EDIT_REQUESTED: "รอการแก้ไข",
  COMPLETED: "จบการฝึกงาน",
};

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
  EDIT_REQUESTED: "bg-orange-100 text-orange-700",
  COMPLETED: "bg-blue-100 text-blue-700",
};

function normalizeStatusKey(value: string): string {
  const normalized = value.trim();

  const thaiToKey: Record<string, string> = {
    "รอดำเนินการ": "PENDING",
    "อนุมัติ": "APPROVED",
    "อนุมัติแล้ว": "APPROVED",
    "ถูกตีกลับ": "REJECTED",
    "รอการแก้ไข": "EDIT_REQUESTED",
    "รอแก้ไข": "EDIT_REQUESTED",
    "จบการฝึกงาน": "COMPLETED",
  };

  return thaiToKey[normalized] ?? normalized;
}

function parseStatusChangedDescription(description: string) {
  const match = description.match(/^เปลี่ยนสถานะเป็น: (.+?)(?:\s*\(หมายเหตุ: (.+)\))?$/);
  if (!match) {
    return null;
  }

  return {
    status: normalizeStatusKey(match[1]),
    note: match[2] ?? null,
  };
}

const toneColorDotClasses: Record<string, string> = {
  green: "bg-emerald-500 border-emerald-200 outline-emerald-100",
  red: "bg-rose-500 border-rose-200 outline-rose-100",
  yellow: "bg-amber-500 border-amber-200 outline-amber-100",
  amber: "bg-amber-500 border-amber-200 outline-amber-100",
  sky: "bg-sky-500 border-sky-200 outline-sky-100",
  violet: "bg-violet-500 border-violet-200 outline-violet-100",
  orange: "bg-orange-500 border-orange-200 outline-orange-100",
  teal: "bg-teal-500 border-teal-200 outline-teal-100",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "รอดำเนินการ", color: "text-amber-600 bg-amber-50 border-amber-100" },
  APPROVED: { label: "อนุมัติ", color: "text-emerald-600 bg-emerald-50 border-emerald-100" },
  REJECTED: { label: "ถูกตีกลับ", color: "text-rose-600 bg-rose-50 border-rose-100" },
  EDIT_REQUESTED: { label: "รอการแก้ไข", color: "text-orange-600 bg-orange-50 border-orange-100" },
  COMPLETED: { label: "จบการฝึกงาน", color: "text-sky-600 bg-sky-50 border-sky-100" },
};

export default function StudentDashboardPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dashboard, setDashboard] = useState<StudentDashboardResponse | null>(null);

  // Re-upload modal state
  const [reuploadFile, setReuploadFile] = useState<StudentFile | null>(null);
  const [selectedNewFile, setSelectedNewFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const profile: StudentProfile = dashboard?.profile ?? {
    firstName: "",
    lastName: "",
    phone: "",
    parentPhone: "",
    faculty: "",
    major: "",
    educationLevel: "",
    institution: "",
    guardianRelationship: "",
    files: [],
    internship: null,
    user: { email: "" },
    leaveRequests: [],
  };
  const recentActivities = dashboard?.recentActivities ?? [];

  async function loadDashboard() {
    try {
      const response = await fetch("/api/student/dashboard", { cache: "no-store" });
      if (!response.ok) {
        setDashboard(null);
        return;
      }

      const data = (await response.json()) as StudentDashboardResponse;
      setDashboard(data);
    } catch {
      setDashboard(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, []);

  async function handleReuploadConfirm() {
    if (!reuploadFile || !selectedNewFile) return;
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", selectedNewFile);
      const res = await fetch(`/api/student/attachments/${reuploadFile.id}/reupload`, {
        method: "PATCH",
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        setUploadError(err.error || "เกิดข้อผิดพลาด");
        return;
      }
      setReuploadFile(null);
      setSelectedNewFile(null);
      setIsLoading(true);
      await loadDashboard();
    } catch {
      setUploadError("เกิดข้อผิดพลาดในการอัปโหลด");
    } finally {
      setIsUploading(false);
    }
  }

  const status = profile?.internship?.internshipStatus || "ไม่มีข้อมูล";
  const documentPhaseStatuses = ["รอดำเนินการเอกสาร", "เอกสารสมบูรณ์", "รออนุมัติ", "PENDING", "Rejected", "REJECTED", "ตีกลับ", "ตีกลับ / รอแก้ไข", "Completed"];
  const isDocumentPhase = !profile?.internship || (documentPhaseStatuses.includes(status) && status !== "Completed");
  const isCompleted = status === "Completed";

  let totalDays = 90, daysCompleted = 0, progressPercent = 0;
  if (!isDocumentPhase && profile?.internship?.startDate && profile?.internship?.endDate) {
    const start = new Date(profile.internship.startDate);
    const end = new Date(profile.internship.endDate);
    const now = new Date();
    totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    daysCompleted = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (daysCompleted < 0) daysCompleted = 0;
    if (daysCompleted > totalDays) daysCompleted = totalDays;
    progressPercent = Math.round((daysCompleted / totalDays) * 100);
  }

  const isProfileComplete = profile?.firstName && profile?.firstName !== "ไม่ระบุ";
  const isRejected = ["Rejected", "REJECTED", "ตีกลับ", "ตีกลับ / รอแก้ไข"].includes(status);
  const isAdminReview = ["รอดำเนินการเอกสาร", "PENDING", "รออนุมัติ"].includes(status) && !isRejected;
  const isFinalApproval = ["เอกสารสมบูรณ์", "กำลังฝึกงาน"].includes(status);
  const rejectedFiles = profile.files?.filter((f) => f.status === "REJECTED") || [];

  const fieldMap: Record<string, string> = {
    prefix: "คำนำหน้า",
    firstNameTh: "ชื่อ (ภาษาไทย)",
    lastNameTh: "นามสกุล (ภาษาไทย)",
    gender: "เพศ",
    dob: "วันเกิด",
    phoneNumber: "เบอร์โทรศัพท์",
    contactAddress: "ที่อยู่",
    guardianName: "ชื่อผู้ปกครอง",
    guardianRelationship: "ความสัมพันธ์",
    emergencyPhone: "เบอร์โทรศัพท์ผู้ปกครอง",
    educationLevel: "ระดับการศึกษา",
    institution: "สถาบัน",
    faculty: "คณะ",
    major: "สาขา",
    advisorName: "อาจารย์ที่ปรึกษา",
    advisorPhone: "เบอร์อาจารย์",
    position: "ตำแหน่ง",
    department: "หน่วยงาน",
    company: "บริษัท",
    startDate: "วันเริ่มฝึกงาน",
    endDate: "วันสิ้นสุดฝึกงาน",
    supervisorName: "ผู้ดูแล",
    remarks: "หมายเหตุ"
  };

  let flaggedFields: string[] = [];
  let isDocumentRejection = false;
  if (isRejected) {
    if (profile?.internship?.rejectReason) {
      try {
        const parsed = JSON.parse(profile.internship.rejectReason);
        if (Array.isArray(parsed) && parsed.length > 0) {
          flaggedFields = parsed;
        } else {
          isDocumentRejection = true;
        }
      } catch {
        isDocumentRejection = true;
      }
    } else {
      isDocumentRejection = true;
    }
  }

  return (
    <div className="w-full min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-8 px-4 flex flex-col gap-6 font-sans">

        {/* Hero */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col gap-8 animate-fade-up delay-0">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">ยินดีต้อนรับกลับมา {profile.firstName || "นักศึกษา"}</h1>
              <p className="text-sm text-gray-500 mt-2">นี่คือสถานะล่าสุดของความคืบหน้าการฝึกงานของคุณ</p>
            </div>
            <Link href="/intern/student/internship-form" className="px-6 py-3 bg-gradient-to-r from-[#FF9B5C] to-[#F16422] text-white font-semibold rounded-xl shadow-md hover:shadow-lg hover:brightness-95 flex items-center gap-2 transition-all duration-150 active:scale-[0.97]">
              <FileText className="w-5 h-5" /> กดเพื่อดูแบบฟอร์มการฝึกงาน
            </Link>
          </div>

          {isLoading ? (
            <div className="bg-[#f8f9fa] rounded-xl p-6 border border-gray-100 flex flex-col items-center justify-center gap-2">
              <Clock className="w-6 h-6 text-gray-400 animate-pulse" />
              <p className="text-sm text-gray-500">กำลังโหลดข้อมูลจากระบบ...</p>
            </div>
          ) : isDocumentPhase ? (
            <div className="mt-4 flex flex-col items-center max-w-4xl mx-auto w-full px-12">
              <div className="relative flex justify-between w-full z-10 text-center">
                <div className="absolute top-6 left-10 right-10 h-[2px] bg-gray-200 -z-10" />
                {/* Step 1 */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-white ring-2 ${isProfileComplete ? "bg-[#10B981] ring-[#10B981]" : "bg-gray-200 ring-gray-200"} text-white`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isProfileComplete ? "text-[#10B981]" : "text-gray-500"}`}>ความสมบูรณ์ของโปรไฟล์</p>
                    <p className="text-sm text-gray-500">{isProfileComplete ? "เสร็จสมบูรณ์" : "รอดำเนินการ"}</p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-white ring-2 ${isRejected ? "bg-red-500 ring-red-500" : isAdminReview ? "bg-[#F59E0B] ring-[#F59E0B]" : isFinalApproval ? "bg-[#10B981] ring-[#10B981]" : "bg-gray-200 ring-gray-200"} text-white`}>
                    {isRejected ? <AlertCircle className="w-6 h-6" /> : <Hourglass className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className={`font-semibold ${isRejected ? "text-red-500" : isAdminReview ? "text-[#F59E0B]" : isFinalApproval ? "text-[#10B981]" : "text-gray-500"}`}>
                      {isRejected ? "ต้องดำเนินการ" : "ผู้ดูแลกำลังตรวจสอบ"}
                    </p>
                    <p className="text-sm text-gray-500 font-bold">
                      {isRejected ? "ถูกตีกลับ" : isAdminReview ? "รอตรวจสอบ" : isFinalApproval ? "อนุมัติแล้ว" : "กำลังรอ"}
                    </p>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex flex-col items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-[3px] border-white ring-2 ${isFinalApproval ? "bg-[#F26522] ring-[#F26522]" : "bg-gray-200 ring-gray-200"} text-white`}>
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isFinalApproval ? "text-[#F26522]" : "text-gray-500"}`}>อนุมัติ</p>
                    <p className="text-sm text-gray-500">{isFinalApproval ? "ปลดล็อกแล้ว" : "ล็อกอยู่"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-[#f8f9fa] rounded-xl p-6 border border-gray-100 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-sm font-semibold text-gray-600">สถานะการฝึกงาน: <span className={`${isCompleted ? "text-blue-600" : "text-[#F26522]"} uppercase tracking-wide`}>{status}</span></p>
                  <h2 className="text-2xl font-bold text-gray-900 mt-1">{isCompleted ? "ฝึกงานสำเร็จเรียบร้อยแล้ว" : `ฝึกงานแล้ว ${daysCompleted} จาก ${totalDays} วัน`}</h2>
                </div>
                {!isCompleted && <p className="text-sm font-bold text-[#F26522]">เหลืออีก {totalDays - daysCompleted} วัน</p>}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
                <div className={`${isCompleted ? "bg-blue-600" : "bg-[#F26522]"} h-3.5 rounded-full transition-all duration-1000`} style={{ width: `${progressPercent}%` }} />
              </div>
              <div className="flex justify-end">
                <span className="text-xs font-bold text-gray-700">{isCompleted ? "เสร็จสิ้น 100%" : `ความคืบหน้า ${progressPercent}%`}</span>
              </div>
            </div>
          )}
        </div>

        {/* Rejection Alert */}
        {isRejected && (
          <div className="bg-red-50 border-2 border-red-100 rounded-2xl p-6 flex items-start gap-4 animate-fade-up delay-100">
            <div className="bg-red-500 p-2 rounded-xl text-white"><AlertCircle className="w-6 h-6" /></div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-red-700">คำร้องของคุณถูกตีกลับ (ต้องดำเนินการ)</h3>
              <div className="mt-2 flex flex-col gap-1.5">
                <p className="text-red-600 font-bold text-sm">โปรดแก้ไขข้อมูลดังต่อไปนี้:</p>
                <ul className="list-disc list-inside text-red-600 text-sm font-medium space-y-1">
                  {flaggedFields.length > 0 ? (
                    flaggedFields.map((field, idx) => (
                      <li key={idx} className="leading-relaxed">ข้อมูล <span className="font-black underline">{fieldMap[field] || field}</span> ไม่ถูกต้อง</li>
                    ))
                  ) : (
                    <li>เอกสารไม่ผ่าน กรุณาแก้ไขให้ถูกต้อง</li>
                  )}
                </ul>
              </div>
              <div className="mt-5">
                <Link href="/intern/student/internship-form" className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-all shadow-md shadow-red-200 flex items-center gap-2 w-fit active:scale-95">
                  แก้ไขข้อมูล / ส่งรอบใหม่ <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Info Cards Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">

          {/* Row 1, Col 1: Personal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out animate-fade-up delay-100 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-orange-50 rounded-lg text-[#F26522]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-slate-800">ข้อมูลส่วนบุคคล</h3>
            </div>
            <div className="flex flex-col gap-4 text-sm flex-1">
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">ชื่อ - นามสกุล</p><p className="font-semibold text-gray-900">{profile.firstName} {profile.lastName}</p></div>
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">อีเมล</p><p className="font-semibold text-gray-900">{profile.user?.email || "N/A"}</p></div>
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">เบอร์โทรศัพท์</p><p className="font-semibold text-gray-900">{profile.phone || "ไม่ระบุ"}</p></div>
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">เบอร์ติดต่อฉุกเฉิน</p><p className="font-semibold text-red-600">{profile.parentPhone || "ไม่ระบุ"} {profile.guardianRelationship ? `(${profile.guardianRelationship})` : "(ผู้ปกครอง)"}</p></div>
            </div>
          </div>

          {/* Row 1, Col 2: Documents */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out animate-fade-up delay-150 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-orange-50 rounded-lg text-[#F26522]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-slate-800">เอกสาร</h3>
            </div>
            <div className="border border-gray-200 rounded-xl p-2 bg-gray-50/20 flex-1 flex flex-col">
              <div className="flex flex-col gap-2 flex-1 overflow-y-auto pr-1 custom-scrollbar">
                {profile.files && profile.files.length > 0 ? profile.files.map((file) => {
                  const displayStatus = file.status || "PENDING";
                  let iconColor = "", bgColor = "", StatusIcon = null;

                  if (displayStatus === "APPROVED") {
                    iconColor = "text-green-500"; bgColor = "bg-green-50"; StatusIcon = <CheckCircle className="w-5 h-5 text-green-500" />;
                  } else if (displayStatus === "REJECTED") {
                    iconColor = "text-red-500"; bgColor = "bg-red-50"; StatusIcon = <XCircle className="w-5 h-5 text-red-500" />;
                  } else {
                    iconColor = "text-yellow-500"; bgColor = "bg-yellow-50"; StatusIcon = <Clock className="w-5 h-5 text-yellow-500" />;
                  }

                  const statusValue = profile?.internship?.internshipStatus || "";
                  const normalizedStatus = normalizeStatusKey(statusValue);
                  const isFilesLocked = normalizedStatus === "APPROVED" || normalizedStatus === "EDIT_REQUESTED" || normalizedStatus === "COMPLETED";
                  const isClickable = !isFilesLocked && (displayStatus === "APPROVED" || displayStatus === "REJECTED");
                  const tooltip = isFilesLocked ? "ไม่อนุญาตให้แก้ไขไฟล์ในสถานะนี้" : (displayStatus === "APPROVED" ? "คลิกเพื่อแก้ไขไฟล์" : displayStatus === "REJECTED" ? "คลิกเพื่ออัปโหลดใหม่" : "");

                  return (
                    <div
                      key={file.id}
                      title={tooltip}
                      onClick={isClickable ? () => { setReuploadFile(file); setSelectedNewFile(null); setUploadError(null); } : undefined}
                      className={`flex justify-between items-center bg-white border border-gray-100 rounded-lg p-2.5 transition-all ${isClickable ? "cursor-pointer hover:bg-gray-50 hover:border-gray-200 hover:shadow-sm" : "cursor-default"}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`${bgColor} ${iconColor} p-2 rounded-lg shrink-0`}>
                          <FileText className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-gray-700 truncate">{file.fileName}</span>
                      </div>
                      <div className="shrink-0">
                        {StatusIcon}
                      </div>
                    </div>
                  );
                }) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <FileText className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-gray-400 text-xs font-bold">ไม่มีเอกสารที่อัปโหลด</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Column 3: Recent Activities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out animate-fade-up delay-200 md:row-span-2">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-orange-50 rounded-lg text-[#F26522]">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800">กิจกรรมล่าสุด</h3>
            </div>
            <div className="relative border-l-[3px] border-gray-100 ml-2 mt-2 flex flex-col gap-0 pb-2">
              {recentActivities.slice(0, 6).length > 0 ? recentActivities.slice(0, 6).map((act, idx: number) => {
                const dotColorClass = toneColorDotClasses[act.toneColor || "sky"] || toneColorDotClasses.sky;

                return (
                  <div
                    key={act.id}
                    className="relative pl-7 pb-7 last:pb-0 group animate-fade-up"
                    style={{ animationDelay: `${200 + idx * 60}ms` }}
                  >
                    <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-4 border-white outline outline-4 ${dotColorClass} z-10 transition-transform group-hover:scale-110`} />
                    <p className="text-sm font-bold text-gray-800 leading-snug">
                      {act.action === "STATUS_CHANGED" && act.oldValue === "EDIT_REQUESTED" && act.newValue === "APPROVED"
                        ? "แอดมินยอมรับการแก้ไข"
                        : act.action === "STATUS_CHANGED" && act.oldValue === "APPROVED" && act.newValue === "COMPLETED"
                        ? "สำเร็จการฝึกงาน"
                        : (actionLabel[act.action] || act.action)}
                    </p>

                    {/* Show transition UI for status changes and resubmissions */}
                    {(act.action === "STATUS_CHANGED" || act.action === "RESUBMIT" || act.action === "APPROVE_INTERN" || act.action === "REJECT_INTERN") && act.oldValue && act.newValue ? (
                      <div className="mt-1.5 flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${STATUS_LABELS[act.oldValue] ? STATUS_LABELS[act.oldValue].color : "text-gray-500 bg-gray-50 border-gray-100"}`}>
                            {STATUS_LABELS[act.oldValue] ? STATUS_LABELS[act.oldValue].label : act.oldValue}
                          </span>
                          <span className="text-gray-400 text-[10px]">→</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${STATUS_LABELS[act.newValue] ? STATUS_LABELS[act.newValue].color : "text-gray-500 bg-gray-50 border-gray-100"}`}>
                            {STATUS_LABELS[act.newValue] ? STATUS_LABELS[act.newValue].label : act.newValue}
                          </span>
                        </div>
                        {act.description.includes("(หมายเหตุ:") ? (
                          <p className="text-xs text-gray-500 italic">
                            {act.description.split("(หมายเหตุ:")[1].replace(")", "").trim()}
                          </p>
                        ) : (
                          act.action === "RESUBMIT" && (
                            <p className="text-xs text-gray-500 mt-1">{act.description}</p>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">{act.description}</p>
                    )}

                    <p className="text-[11px] text-gray-400 mt-1.5 font-medium">{dayjs(act.createdAt).fromNow()}</p>
                  </div>
                );
              }) : (
                <p className="text-gray-400 text-sm text-center py-8 pl-7">ยังไม่มีกิจกรรม</p>
              )}
            </div>
          </div>

          {/* Row 2, Col 1: Education */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out animate-fade-up delay-150 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-orange-50 rounded-lg text-[#F26522]">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg text-slate-800">ข้อมูลการศึกษา</h3>
            </div>
            <div className="flex flex-col gap-4 text-sm flex-1">
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">สถาบัน</p><p className="font-semibold text-gray-900">{profile.institution || "N/A"}</p></div>
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">คณะ</p><p className="font-semibold text-gray-900">{profile.faculty || "N/A"}</p></div>
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">สาขา</p><p className="font-semibold text-gray-900">{profile.major || "N/A"}</p></div>
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">ระดับการศึกษา</p><p className="font-semibold text-[#F26522]">{profile.educationLevel || "N/A"}</p></div>
            </div>
          </div>

          {/* Row 2, Col 2: Internship Detail */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 ease-out animate-fade-up delay-200 h-full">
            <div className="flex items-center gap-2 mb-5">
              <div className="p-2 bg-orange-50 rounded-lg text-[#F26522]">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              </div>
              <h3 className="font-semibold text-lg text-slate-800">รายละเอียดการฝึกงาน</h3>
            </div>
            <div className="flex flex-col gap-4 text-sm flex-1">
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">ตำแหน่ง</p><p className="font-semibold text-gray-900">{profile.internship?.position || "N/A"}</p></div>
              <div><p className="text-gray-400 text-xs tracking-wider mb-1">หน่วยงาน</p><p className="font-semibold text-gray-900">{profile.internship?.departmentUnit || "N/A"}</p></div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">ระยะเวลาฝึกงาน</p>
                <p className="font-semibold text-gray-900">
                  {profile.internship?.startDate ? dayjs(profile.internship.startDate).format("DD/MM/YYYY") : "N/A"} - {profile.internship?.endDate ? dayjs(profile.internship.endDate).format("DD/MM/YYYY") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-xs tracking-wider mb-1">ผู้ดูแล</p>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{profile.internship?.supervisorName || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Re-upload Modal */}
      {reuploadFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-gray-900">
              {reuploadFile.status === "REJECTED" ? "อัปโหลดไฟล์ใหม่" : "แก้ไขไฟล์"}
            </h2>
            <div className="flex flex-col gap-1">
              <p className="text-sm text-gray-500 truncate">
                <span className="font-semibold text-gray-700">ไฟล์ปัจจุบัน:</span> {reuploadFile.fileName}
              </p>

              {reuploadFile.rejectReason && (
                <div className="bg-red-50/80 border border-red-100 rounded-xl p-3.5 mt-1 transition-all animate-in fade-in slide-in-from-top-1">
                  <div className="flex items-start gap-2.5">
                    <div className="bg-red-500 rounded-full p-0.5 mt-0.5 shrink-0 shadow-sm">
                      <AlertCircle className="w-3.5 h-3.5 text-white" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[11px] font-black text-red-600 uppercase tracking-wider">เหตุผลที่ต้องแก้ไข</p>
                      <p className="text-sm text-red-700 font-medium leading-relaxed">{reuploadFile.rejectReason}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div
              className="border-2 border-dashed border-gray-200 rounded-xl p-5 flex flex-col items-center gap-2 bg-gray-50 cursor-pointer hover:border-[#F26522] transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-8 h-8 text-gray-300" />
              {selectedNewFile ? (
                <p className="text-sm font-semibold text-[#F26522] text-center truncate max-w-full px-2">{selectedNewFile.name}</p>
              ) : (
                <p className="text-sm text-gray-400 text-center">คลิกเพื่อเลือกไฟล์ (PDF, PNG, JPG สูงสุด 5MB)</p>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0] || null;
                  if (f && f.size > 5 * 1024 * 1024) {
                    setUploadError("ไฟล์มีขนาดเกิน 5MB");
                    setSelectedNewFile(null);
                  } else {
                    setUploadError(null);
                    setSelectedNewFile(f);
                  }
                }}
              />
            </div>

            {uploadError && (
              <p className="text-sm text-red-500 font-medium">{uploadError}</p>
            )}

            <div className="flex gap-3 justify-end pt-1">
              <button
                onClick={() => { setReuploadFile(null); setSelectedNewFile(null); setUploadError(null); }}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReuploadConfirm}
                disabled={!selectedNewFile || isUploading}
                className="px-5 py-2 rounded-xl bg-[#F26522] text-white text-sm font-bold hover:bg-[#d9551a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? "กำลังอัปโหลด..." : "ยืนยันการอัปโหลด"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
