"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Search, Eye, CheckCircle2, ClipboardList, Users, ChevronDown } from "lucide-react";
import dayjs from "dayjs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import AnimatedNumber from "@/components/AnimatedNumber";
import ApplicationReviewDrawer from "@/components/admin/ApplicationReviewDrawer";

type InternshipStatus = "PENDING" | "APPROVED" | "REJECTED" | "EDIT_REQUESTED" | "COMPLETED";
type CardFilter = "ALL" | "ACTION_REQUIRED" | "APPROVED_ZONE" | "COMPLETED" | "REJECTED";

type ApplicationItem = {
  id: string;
  position: string;
  department: string | null;
  company: string | null;
  departmentUnit: string;
  internshipStatus: InternshipStatus;
  createdAt: string;
  startDate: string | null;
  endDate: string | null;
  remarks: string | null;
  supervisorName: string | null;
  profile: {
    userId: string;
    email: string;
    profilePictureUrl: string | null;
    prefix: string;
    firstName: string;
    lastName: string;
    gender: string | null;
    dob: string | null;
    phoneNumber: string | null;
    emergencyPhone: string | null;
    contactAddress: string | null;
    guardianName: string | null;
    guardianRelationship: string | null;
    educationLevel: string;
    institution: string;
    faculty: string;
    major: string;
    advisorName: string | null;
    advisorPhone: string | null;
  };
  attachments: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    status: string;
    rejectReason?: string | null;
  }[];
  flaggedFields: Record<string, { flagged: boolean; reason: string }> | null;
  previousSnapshot: Record<string, string | null | undefined> | null;
};

type DrawerRecord = {
  id: string;
  status: string;
  position: string;
  department?: string | null;
  company?: string | null;
  supervisorName?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  remarks?: string | null;
  studentProfile?: {
    userId: string;
    profilePictureUrl?: string | null;
    prefix: string;
    firstNameTh: string;
    lastNameTh: string;
    gender?: string | null;
    dob?: Date | null;
    phoneNumber?: string | null;
    emergencyPhone?: string | null;
    contactAddress?: string | null;
    guardianName?: string | null;
    guardianRelationship?: string | null;
    educationLevel: string;
    institution: string;
    faculty: string;
    major: string;
    advisorName?: string | null;
    advisorPhone?: string | null;
    user?: { email?: string | null };
  } | null;
  attachments?: {
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    status?: string;
    rejectReason?: string | null;
  }[];
  flaggedFields?: Record<string, { flagged: boolean; reason: string }> | null;
  previousSnapshot?: Record<string, string | null | undefined> | null;
};

type InternshipsClientProps = {
  applications: ApplicationItem[];
  defaultStatus?: string;
};

const ACTION_REQUIRED_STATUSES: InternshipStatus[] = ["PENDING"];
const APPROVED_ZONE_STATUSES: InternshipStatus[] = ["APPROVED", "EDIT_REQUESTED"];
const COMPLETED_STATUSES: InternshipStatus[] = ["COMPLETED"];
const REJECTED_STATUSES: InternshipStatus[] = ["REJECTED"];

function mapStatusParamToFilter(status: string | null | undefined): CardFilter {
  if (!status) return "ALL";

  switch (status.toUpperCase()) {
    case "PENDING":
    case "ACTION_REQUIRED":
      return "ACTION_REQUIRED";
    case "APPROVED":
    case "APPROVED_ZONE":
    case "EDIT_REQUESTED":
      return "APPROVED_ZONE";
    case "COMPLETED":
      return "COMPLETED";
    case "REJECTED":
      return "REJECTED";
    default:
      return "ALL";
  }
}

function mapFilterToStatusParam(filter: CardFilter): string | null {
  switch (filter) {
    case "ACTION_REQUIRED": return "pending";
    case "APPROVED_ZONE": return "approved";
    case "COMPLETED": return "completed";
    case "REJECTED": return "rejected";
    default: return null;
  }
}

function getEffectiveStatus(
  app: ApplicationItem,
  overrides: Record<string, { status: string }>
): InternshipStatus {
  return (overrides[app.id]?.status ?? app.internshipStatus) as InternshipStatus;
}

function filterByCard(status: InternshipStatus, card: CardFilter): boolean {
  if (card === "ALL") return true;
  if (card === "ACTION_REQUIRED") return ACTION_REQUIRED_STATUSES.includes(status);
  if (card === "APPROVED_ZONE") return APPROVED_ZONE_STATUSES.includes(status);
  if (card === "COMPLETED") return COMPLETED_STATUSES.includes(status);
  if (card === "REJECTED") return REJECTED_STATUSES.includes(status);
  return true;
}

// Map DB app to the InternshipRecord shape expected by ApplicationReviewDrawer
function toDrawerRecord(app: ApplicationItem): DrawerRecord {
  return {
    id: app.id,
    status: app.internshipStatus,
    position: app.position,
    department: app.department,
    company: app.company,
    supervisorName: app.supervisorName,
    startDate: app.startDate ? new Date(app.startDate) : null,
    endDate: app.endDate ? new Date(app.endDate) : null,
    remarks: app.remarks,
    studentProfile: {
      userId: app.profile.userId,
      profilePictureUrl: app.profile.profilePictureUrl,
      prefix: app.profile.prefix,
      firstNameTh: app.profile.firstName,
      lastNameTh: app.profile.lastName,
      gender: app.profile.gender,
      dob: app.profile.dob ? new Date(app.profile.dob) : null,
      phoneNumber: app.profile.phoneNumber,
      emergencyPhone: app.profile.emergencyPhone,
      contactAddress: app.profile.contactAddress,
      guardianName: app.profile.guardianName,
      guardianRelationship: app.profile.guardianRelationship,
      educationLevel: app.profile.educationLevel,
      institution: app.profile.institution,
      faculty: app.profile.faculty,
      major: app.profile.major,
      advisorName: app.profile.advisorName,
      advisorPhone: app.profile.advisorPhone,
      user: { email: app.profile.email },
    },
    attachments: app.attachments,
    flaggedFields: app.flaggedFields,
    previousSnapshot: app.previousSnapshot,
  };
}

function getStatusBadge(status: string) {
  if (["Approved", "APPROVED"].includes(status))
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#d1fae5] text-[#059669] rounded-full text-[11px] font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-[#059669]" /> อนุมัติแล้ว</span>;
  if (["REJECTED"].includes(status))
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-600 rounded-full text-[11px] font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-red-600" /> ถูกตีกลับ</span>;
  if (["Completed", "COMPLETED"].includes(status))
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-[11px] font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-teal-600" /> จบการฝึกงาน</span>;
  if (["EDIT_REQUESTED"].includes(status))
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[11px] font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> รอตรวจสอบการแก้ไข</span>;
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-100/80 text-orange-600 rounded-full text-[11px] font-extrabold"><span className="w-1.5 h-1.5 rounded-full bg-orange-500" /> รอดำเนินการ</span>;
}

const ITEMS_PER_PAGE = 8;

export default function InternshipsClient({ applications, defaultStatus: initialStatus }: InternshipsClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const defaultStatus = initialStatus || searchParams.get("status") || "ALL";
  
  const [hasMounted, setHasMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<CardFilter>(mapStatusParamToFilter(defaultStatus));

  const handleFilterChange = (filter: CardFilter) => {
    setStatusFilter(filter);
    setCurrentPage(1);
    
    const params = new URLSearchParams(searchParams.toString());
    const status = mapFilterToStatusParam(filter);
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [showSort, setShowSort] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedInternship, setSelectedInternship] = useState<DrawerRecord | null>(null);
  const [internshipOverrides, setInternshipOverrides] = useState<Record<string, DrawerRecord>>({});

  function openDrawer(app: ApplicationItem) {
    const record = internshipOverrides[app.id] ?? toDrawerRecord(app);
    setSelectedInternship(record);
    setDrawerOpen(true);
  }

  function handleDrawerUpdate(updated: DrawerRecord) {
    setSelectedInternship(updated);
    setInternshipOverrides((prev) => ({ ...prev, [updated.id]: updated }));
  }

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    setStatusFilter(mapStatusParamToFilter(defaultStatus));
  }, [defaultStatus]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) setShowSort(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortBy]);

  const groupCounts = useMemo(() => {
    return {
      actionRequired: applications.filter(
        (a) => ACTION_REQUIRED_STATUSES.includes(getEffectiveStatus(a, internshipOverrides))
      ).length,
      approvedZone: applications.filter(
        (a) => APPROVED_ZONE_STATUSES.includes(getEffectiveStatus(a, internshipOverrides))
      ).length,
      completed: applications.filter(
        (a) => COMPLETED_STATUSES.includes(getEffectiveStatus(a, internshipOverrides))
      ).length,
      rejected: applications.filter(
        (a) => REJECTED_STATUSES.includes(getEffectiveStatus(a, internshipOverrides))
      ).length,
      total: applications.length,
    };
  }, [applications, internshipOverrides]);

  const filteredApps = useMemo(() =>
    applications
      .filter((app) => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = !q ||
          app.profile.firstName.toLowerCase().includes(q) ||
          app.profile.lastName.toLowerCase().includes(q) ||
          app.position.toLowerCase().includes(q) ||
          app.departmentUnit.toLowerCase().includes(q) ||
          app.profile.major.toLowerCase().includes(q);
        if (!matchesSearch) return false;
        return filterByCard(getEffectiveStatus(app, internshipOverrides), statusFilter);
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
      }),
  [applications, searchQuery, statusFilter, sortBy, internshipOverrides]);

  const totalPages = Math.ceil(filteredApps.length / ITEMS_PER_PAGE);
  const paginatedApps = filteredApps.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="w-full max-w-[1400px] mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans flex flex-col gap-6">

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {[
          { label: "รอดำเนินการ", sub: "Action Required", count: groupCounts.actionRequired, filter: "ACTION_REQUIRED" as CardFilter, border: "border-orange-500", icon: <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-orange-500" strokeWidth={2.5} />, iconBg: "bg-orange-50", delay: "delay-0" },
          { label: "ถูกตีกลับ", sub: "Waiting for Fix", count: groupCounts.rejected, filter: "REJECTED" as CardFilter, border: "border-red-500", icon: <ClipboardList className="w-5 h-5 md:w-6 md:h-6 text-red-500" strokeWidth={2.5} />, iconBg: "bg-red-50", delay: "delay-75" },
          { label: "โซนอนุมัติ", sub: "Approved Zone", count: groupCounts.approvedZone, filter: "APPROVED_ZONE" as CardFilter, border: "border-green-500", icon: <CheckCircle2 fill="currentColor" stroke="white" className="w-6 h-6 md:w-8 md:h-8 text-green-500" strokeWidth={1} />, iconBg: "bg-green-50", delay: "delay-100" },
          { label: "จบการฝึกงาน", sub: "Completed", count: groupCounts.completed, filter: "COMPLETED" as CardFilter, border: "border-blue-600", icon: <CheckCircle2 fill="currentColor" stroke="white" className="w-6 h-6 md:w-8 md:h-8 text-blue-600" strokeWidth={1} />, iconBg: "bg-blue-50", delay: "delay-150" },
          { label: "รวมทั้งหมด", sub: "Total", count: groupCounts.total, filter: "ALL" as CardFilter, border: "border-purple-600", icon: <Users className="w-6 h-6 md:w-7 md:h-7 text-purple-600" />, iconBg: "bg-purple-50", delay: "delay-200" },
        ].map(({ label, sub, count, filter, border, icon, iconBg, delay }) => (
          <button
            key={filter}
            onClick={() => handleFilterChange(filter)}
            className={`animate-fade-up ${delay} bg-white rounded-2xl p-4 md:p-6 flex justify-between items-center w-full transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl active:scale-[0.97] text-left ${statusFilter === filter ? `border-2 ${border} shadow-md` : "border border-gray-100 shadow-sm"} ${filter === "ALL" ? "col-span-2 md:col-span-1" : ""}`}
          >
            <span className="flex flex-col">
              <p className="text-sm md:font-semibold text-slate-800">{label}</p>
              <p className="text-[10px] md:text-xs text-gray-400 mb-1 md:mb-2">{sub}</p>
              <AnimatedNumber value={count} duration={900} className="text-2xl md:text-[40px] font-black text-gray-900 leading-none tabular-nums" />
            </span>
            <span className={`w-10 h-10 md:w-14 md:h-14 ${iconBg} rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110`}>
              {icon}
            </span>
          </button>
        ))}
      </div>

      {/* Master Table Card */}
      <div className="animate-fade-up delay-250 bg-white border border-gray-100 rounded-2xl shadow-md overflow-hidden flex flex-col w-full min-h-[500px]">
        {/* Controls */}
        <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Recent Internship Applications</h2>
            <p className="text-xs md:text-sm text-gray-500">Manage and review student internship submissions</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            <div className="relative w-full sm:w-auto sm:flex-1 md:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, position, major..."
                className="pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:border-[#9E76B4] focus:ring-1 focus:ring-[#9E76B4] outline-none transition-all w-full text-gray-900 h-[42px]"
              />
            </div>
            <div className="relative w-full sm:w-auto" ref={sortRef}>
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-700 border border-gray-200 rounded-xl bg-white hover:border-gray-300 transition-all h-[42px] w-full sm:min-w-[140px]"
              >
                <span>{sortBy === "newest" ? "Newest first" : "Oldest first"}</span>
                <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
              </button>
              {showSort && (
                <div className="absolute right-0 top-full mt-1 w-full sm:w-[160px] bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  {["newest", "oldest"].map((val) => (
                    <button
                      key={val}
                      onClick={() => { setSortBy(val as "newest" | "oldest"); setCurrentPage(1); setShowSort(false); }}
                      className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${sortBy === val ? "bg-[#F5EFF9] text-[#9E76B4]" : "text-gray-700 hover:bg-gray-50"}`}
                    >
                      {val === "newest" ? "Newest first" : "Oldest first"}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left min-w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-white">
                <th className="py-3 md:py-4 px-3 md:px-6 text-[10px] md:text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Student Name</th>
                <th className="hidden md:table-cell py-4 px-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Major</th>
                <th className="py-3 md:py-4 px-3 md:px-4 text-[10px] md:text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Applied Company</th>
                <th className="hidden md:table-cell py-4 px-4 text-[11px] font-extrabold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="py-3 md:py-4 px-3 md:px-6 text-[10px] md:text-[11px] font-extrabold text-gray-500 uppercase tracking-wider text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {paginatedApps.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-gray-500 font-medium">No applications found.</td></tr>
              ) : paginatedApps.map((app, idx) => {
                const profile = app.profile;
                const initials = profile.firstName.substring(0, 1) + profile.lastName.substring(0, 1);
                const bgColors = ["bg-blue-100 text-blue-600", "bg-pink-100 text-pink-600", "bg-indigo-100 text-indigo-600", "bg-teal-100 text-teal-600"];
                const badgeColor = bgColors[idx % bgColors.length];

                return (
                  <tr 
                    key={app.id} 
                    onClick={() => openDrawer(app)}
                    className="border-b border-gray-50 hover:bg-slate-50 transition-all duration-200 group animate-fade-up cursor-pointer" 
                    style={{ animationDelay: `${250 + idx * 50}ms` }}
                  >
                    <td className="py-3 md:py-4 px-3 md:px-6">
                      <div className="flex items-center gap-2 md:gap-4">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden font-bold flex items-center justify-center shrink-0 text-xs md:text-sm ${badgeColor}`}>
                          {profile.profilePictureUrl ? (
                            <img src={profile.profilePictureUrl} alt={profile.firstName} className="w-full h-full object-cover" />
                          ) : <span>{initials}</span>}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs md:text-sm font-semibold text-slate-800 truncate">{profile.firstName} {profile.lastName}</span>
                          <span className="text-[10px] md:text-xs font-medium text-gray-400 mt-0.5 truncate hidden sm:block">{profile.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4">
                      <span className="text-sm font-medium text-gray-600">{profile.major || "N/A"}</span>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-4">
                      <div className="flex flex-col min-w-0">
                        <span className="text-[11px] md:text-[13.5px] font-semibold text-slate-800 truncate">{app.departmentUnit}</span>
                        <span className="text-[10px] md:text-xs font-medium text-gray-400 mt-0.5 truncate">{app.position}</span>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-4 px-4">
                      <span className="text-sm font-medium text-gray-600">
                        {hasMounted ? dayjs(app.createdAt).format("MMM DD, YYYY") : "Loading..."}
                      </span>
                    </td>
                    <td className="py-3 md:py-4 px-3 md:px-6 text-center">{getStatusBadge(app.internshipStatus)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm mt-auto bg-white">
            <span className="text-gray-500 font-medium pl-2">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredApps.length)} of {filteredApps.length} entries
            </span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 font-bold hover:bg-gray-50 mr-1 disabled:opacity-50" disabled={currentPage === 1}>Previous</button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} onClick={() => setCurrentPage(p)} className={`w-8 h-8 rounded-lg font-extrabold flex items-center justify-center shadow-sm transition-all ${currentPage === p ? "bg-[#9E76B4] text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>{p}</button>
                ))}
              </div>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} className="px-3 py-1.5 border border-gray-200 rounded-lg text-gray-600 font-bold hover:bg-gray-50 ml-1 disabled:opacity-50" disabled={currentPage === totalPages}>Next</button>
            </div>
          </div>
        )}
      </div>
      <ApplicationReviewDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        internship={selectedInternship}
        onUpdate={handleDrawerUpdate}
      />
    </div>
  );
}
