"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import {
  Combobox,
  ComboboxInput,
  ComboboxButton,
  ComboboxOptions,
  ComboboxOption,
  Listbox,
  ListboxButton,
  ListboxOptions,
  ListboxOption,
} from "@headlessui/react";
import {
  X,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  XCircle,
  FileText,
  Edit2,
  Save,
  RotateCcw,
  ChevronDown,
  Check,
  ExternalLink,
  Undo2,
  Clock,
  Image as ImageIcon,
  Download,
  ArrowLeft,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  updateInternshipStatus,
  updateStudentAndInternshipInfo,
  updateApprovedStudentInfo,
  saveFlaggedFields,
  manualRevertToApproved,
  revertEditRequestedToApproved,
} from "@/app/actions/admin";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  adminInternshipSchema,
  type AdminInternshipFormValues,
} from "@/lib/schemas/admin-internship.schema";


// ─── Searchable Combobox ──────────────────────────────────────────────────────

function AdminSearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  freeText,
  error,
}: any) {
  const [query, setQuery] = useState("");

  const filteredOptions =
    query === ""
      ? options
      : options.filter((o: string) =>
        o.toLowerCase().includes(query.toLowerCase())
      );

  return (
    <Combobox value={value} onChange={onChange}>
      <div className="relative w-full">
        <ComboboxInput
          className={`w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition-all pr-10 ${error
              ? "border-red-500 focus:ring-4 focus:ring-red-500/5"
              : "border-gray-200 bg-white focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5"
            }`}
          displayValue={(item: string) => item}
          onChange={(e) => {
            setQuery(e.target.value);
            if (freeText) onChange(e.target.value);
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-3">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </ComboboxButton>
        <ComboboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
          {filteredOptions.length === 0 && query !== "" ? (
            freeText ? (
              <ComboboxOption
                value={query}
                className="cursor-pointer select-none py-2 px-4 text-gray-700 bg-gray-50 hover:bg-gray-100"
              >
                ใช้ค่าที่ระบุ: &quot;{query}&quot;
              </ComboboxOption>
            ) : (
              <div className="cursor-default select-none py-2 px-4 text-gray-500 italic">
                ไม่พบรายชื่อในระบบ...
              </div>
            )
          ) : (
            filteredOptions.map((opt: string) => (
              <ComboboxOption
                key={opt}
                value={opt}
                className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-900 data-[focus]:bg-[#F5EFF9] data-[focus]:text-[#9E76B4]"
              >
                <span
                  className={`block truncate ${value === opt ? "font-semibold" : "font-normal"}`}
                >
                  {opt}
                </span>
                {value === opt && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9E76B4]">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </ComboboxOption>
            ))
          )}
        </ComboboxOptions>
      </div>
    </Combobox>
  );
}

// ─── Simple Listbox ───────────────────────────────────────────────────────────

function AdminCustomListbox({ options, value, onChange, placeholder, error }: any) {
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative w-full">
        <ListboxButton
          className={`w-full text-left rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none transition-all pr-10 ${error
              ? "border-red-500"
              : "border-gray-200 bg-white focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5"
            }`}
        >
          <span className={`block truncate ${!value ? "text-gray-400" : "text-gray-900 font-medium"}`}>
            {value || placeholder}
          </span>
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </span>
        </ListboxButton>
        <ListboxOptions className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
          {options.map((opt: string) => (
            <ListboxOption
              key={opt}
              value={opt}
              className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-900 data-[focus]:bg-[#F5EFF9] data-[focus]:text-[#9E76B4]"
            >
              <span className={`block truncate ${value === opt ? "font-semibold" : "font-normal"}`}>
                {opt}
              </span>
              {value === opt && (
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9E76B4]">
                  <Check className="h-4 w-4" />
                </span>
              )}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

// ─── Section Divider ──────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-2">
      <h3 className="text-[13px] font-black text-[#9E76B4] uppercase tracking-[0.2em] whitespace-nowrap">
        {children}
      </h3>
      <div className="flex-1 h-px bg-[#E5D5F0]" />
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="text-[14px] font-bold text-gray-700 ml-1">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function ReadonlyField({ value }: { value?: string | null }) {
  return (
    <div className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-[15px] text-gray-800 font-medium">
      {value || "—"}
    </div>
  );
}

function FlaggedFieldWrapper({
  fieldKey,
  rejectionReasons,
  onToggle,
  onReasonChange,
  disabled,
  children,
}: {
  fieldKey: string;
  rejectionReasons: Record<string, { flagged: boolean; reason: string }>;
  onToggle: (key: string) => void;
  onReasonChange: (key: string, reason: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const isFlagged = !!rejectionReasons[fieldKey]?.flagged;
  return (
    <div className="flex flex-col gap-1">
      <div
        role={disabled ? undefined : "button"}
        tabIndex={disabled ? undefined : 0}
        onClick={disabled ? undefined : () => onToggle(fieldKey)}
        onKeyDown={disabled ? undefined : (e) => { if (e.key === "Enter" || e.key === " ") onToggle(fieldKey); }}
        className={`rounded-lg transition-all select-none ${disabled
            ? ""
            : isFlagged
              ? "cursor-pointer ring-2 ring-red-400 bg-red-50"
              : "cursor-pointer hover:ring-1 hover:ring-red-200"
          }`}
      >
        {children}
      </div>
      {isFlagged && (
        <div className="border-l-[3px] border-red-400 pl-3 py-1.5 bg-[#fff5f5] rounded-r-lg">
          <input
            id={`reason-field-${fieldKey}`}
            type="text"
            value={rejectionReasons[fieldKey]?.reason || ""}
            onChange={(e) => onReasonChange(fieldKey, e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="ระบุสิ่งที่ต้องแก้ไข..."
            className="w-full bg-transparent text-sm text-red-700 outline-none placeholder:text-red-300 font-medium"
          />
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

// Snapshot field key → current display value map used for diff highlight
type SnapshotMap = Record<string, string | null | undefined>;

// Returns true if the field value has changed vs. the snapshot
function isChanged(snapshot: SnapshotMap | null | undefined, key: string, current: string | null | undefined): boolean {
  if (!snapshot) return false;
  const prev = snapshot[key] ?? null;
  const cur = current ?? null;
  return prev !== cur;
}

// Wraps a form field with an amber diff-highlight when value changed vs snapshot
function DiffHighlight({
  snapshot,
  fieldKey,
  current,
  children,
}: {
  snapshot: SnapshotMap | null | undefined;
  fieldKey: string;
  current: string | null | undefined;
  children: React.ReactNode;
}) {
  const changed = isChanged(snapshot, fieldKey, current);
  if (!changed) return <>{children}</>;
  return (
    <div className="relative">
      {children}
      <div className="absolute -top-1 -right-1 flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none shadow-sm pointer-events-none">
        แก้ไข
      </div>
    </div>
  );
}

interface InternshipRecord {
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
}

interface ApplicationReviewDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  internship: InternshipRecord | null;
  onUpdate?: (updated: InternshipRecord) => void;
  admins?: any[];
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApplicationReviewDrawer({
  isOpen,
  onClose,
  internship,
  onUpdate,
  admins,
}: ApplicationReviewDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
    const [isCompleteDialogOpen, setIsCompleteDialogOpen] = useState(false);
    const [confirmFullName, setConfirmFullName] = useState("");
    const [confirmNameError, setConfirmNameError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [activeTab, setActiveTab] = useState<string>("info");
  const [hasMounted, setHasMounted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const isInitialFlagsLoad = useRef(false);
  const flagsSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fileReviews, setFileReviews] = useState<
    Record<string, { status: string; reason: string }>
  >({});
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, { flagged: boolean; reason: string }>>({});
  const toggleFlag = (key: string) =>
    setRejectionReasons((prev) => ({
      ...prev,
      [key]: { flagged: !prev[key]?.flagged, reason: prev[key]?.reason || "" },
    }));
  const setFlagReason = (key: string, reason: string) =>
    setRejectionReasons((prev) => ({ ...prev, [key]: { ...prev[key], reason } }));
  // React Hook Form — declared early so reset is available in useEffects below
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<AdminInternshipFormValues>({
    resolver: zodResolver(adminInternshipSchema),
  });

  // Mount flag
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // ESC key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (isEditMode) {
        reset();
        setIsEditMode(false);
      } else {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isEditMode, reset, onClose]);

  // Auto-save rejection reasons (flagged fields) to DB (debounced 600ms)
  useEffect(() => {
    if (!isOpen || !internship?.id) return;
    if (isInitialFlagsLoad.current) {
      isInitialFlagsLoad.current = false;
      return;
    }
    if (flagsSaveTimer.current) clearTimeout(flagsSaveTimer.current);
    flagsSaveTimer.current = setTimeout(() => {
      saveFlaggedFields(internship.id, rejectionReasons);
    }, 600);
    return () => {
      if (flagsSaveTimer.current) clearTimeout(flagsSaveTimer.current);
    };
  }, [rejectionReasons]); // eslint-disable-line react-hooks/exhaustive-deps

  // State Hydration on open
  useEffect(() => {
    if (isOpen && internship) {
      // 1. Hydrate rejectionReasons (personal info flags)
      if (internship.flaggedFields && Object.keys(internship.flaggedFields).length > 0) {
        isInitialFlagsLoad.current = true;
        setRejectionReasons(internship.flaggedFields as Record<string, { flagged: boolean; reason: string }>);
      } else {
        setRejectionReasons({});
      }

      // 2. Hydrate fileReviews (attachments)
      const initial: Record<string, { status: string; reason: string }> = {};
      (internship.attachments || []).forEach((file) => {
        initial[file.id] = { 
          status: file.status || "PENDING", 
          reason: file.rejectReason || "" 
        };
      });
      setFileReviews(initial);

      // 3. Tab logic — always start at Step 1 (Personal Info)
      setActiveTab("info");
    } else if (!isOpen) {
      setFileReviews({});
      setRejectionReasons({});
      setActiveTab("info");
      setIsEditMode(false);
    }
  }, [isOpen, internship?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save rejection reasons (flagged fields) to DB (debounced 600ms)
  useEffect(() => {
    if (!isOpen || !internship?.id) return;
    if (isInitialFlagsLoad.current) {
      isInitialFlagsLoad.current = false;
      return;
    }
    if (flagsSaveTimer.current) clearTimeout(flagsSaveTimer.current);
    flagsSaveTimer.current = setTimeout(() => {
      saveFlaggedFields(internship.id, rejectionReasons);
    }, 600);
    return () => {
      if (flagsSaveTimer.current) clearTimeout(flagsSaveTimer.current);
    };
  }, [rejectionReasons]); // eslint-disable-line react-hooks/exhaustive-deps

  // Populate form when internship changes
  useEffect(() => {
    if (internship) {
      const p = internship.studentProfile;
      reset({
        prefix: p?.prefix || "",
        firstNameTh: p?.firstNameTh || "",
        lastNameTh: p?.lastNameTh || "",
        gender: p?.gender || "",
        dob: p?.dob ? new Date(p.dob).toISOString().split("T")[0] : "",
        phoneNumber: p?.phoneNumber || "",
        contactAddress: p?.contactAddress || "",
        emergencyPhone: p?.emergencyPhone || "",
        guardianName: p?.guardianName || "",
        guardianRelationship: p?.guardianRelationship || "",
        educationLevel: p?.educationLevel || "",
        institution: p?.institution || "",
        faculty: p?.faculty || "",
        major: p?.major || "",
        advisorName: p?.advisorName || "",
        advisorPhone: p?.advisorPhone || "",
        position: internship.position || "",
        department: internship.department || "",
        company: internship.company || "",
        supervisorName: internship.supervisorName || "",
        startDate: internship.startDate
          ? new Date(internship.startDate).toISOString().split("T")[0]
          : "",
        endDate: internship.endDate
          ? new Date(internship.endDate).toISOString().split("T")[0]
          : "",
        remarks: internship.remarks || "",
      });
    }
  }, [internship, reset]);

  const profile = internship?.studentProfile;
  const snapshot = internship?.status === "EDIT_REQUESTED" ? (internship.previousSnapshot ?? null) : null;
  const fullName = profile
    ? `${profile.prefix} ${profile.firstNameTh} ${profile.lastNameTh}`
    : "Unknown Student";
  const files = internship?.attachments || [];
  const activeFile = files.find((f) => f.id === activeTab) || files[0];

  const statusLabel = {
    PENDING: "รอดำเนินการ",
    REJECTED: "ถูกตีกลับ",
    EDIT_REQUESTED: "รอตรวจสอบการแก้ไข",
    APPROVED: "อนุมัติแล้ว",
    COMPLETED: "จบการฝึกงาน",
  }[internship?.status || ""] || internship?.status;

  const statusColor = {
    PENDING: "bg-amber-100 text-amber-700",
    REJECTED: "bg-red-100 text-red-700",
    EDIT_REQUESTED: "bg-blue-100 text-blue-700",
    APPROVED: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-gray-100 text-gray-700",
  }[internship?.status || ""] || "bg-gray-100 text-gray-700";

  const currentStep: 1 | 2 = activeTab === "info" ? 1 : 2;

  const isAllReviewed =
    files.length > 0 &&
    files.every(
      (f) =>
        fileReviews[f.id]?.status === "APPROVED" ||
        fileReviews[f.id]?.status === "REJECTED"
    );


  const canProceed =
    files.length > 0 &&
    files.every((f) => {
      const status = fileReviews[f.id]?.status ?? "PENDING";
      return status === "APPROVED";
    });

  const hasRejectionReasons = Object.values(rejectionReasons).some((f) => f.flagged);
  const hasPendingDocs = files.some((f) => (fileReviews[f.id]?.status ?? f.status) === "PENDING");
  const flagDisabled = ["APPROVED", "COMPLETED"].includes(internship?.status ?? "");
  const requiredStudentName = profile
    ? `${profile.firstNameTh || ""} ${profile.lastNameTh || ""}`.trim()
    : "";

  const normalizeName = (value: string) => value.trim().replace(/\s+/g, " ");

  const onSaveInfo: SubmitHandler<AdminInternshipFormValues> = async (data) => {
    if (!profile?.userId || !internship?.id) return;

    // Build the locally-updated record so parent can cache it
    const buildUpdated = (): InternshipRecord => ({
      ...internship!,
      position: data.position,
      department: data.department,
      company: data.company,
      supervisorName: data.supervisorName,
      startDate: data.startDate ? new Date(data.startDate) : internship!.startDate,
      endDate: data.endDate ? new Date(data.endDate) : internship!.endDate,
      remarks: data.remarks,
      studentProfile: internship!.studentProfile
        ? {
          ...internship!.studentProfile,
          prefix: data.prefix,
          firstNameTh: data.firstNameTh,
          lastNameTh: data.lastNameTh,
          gender: data.gender,
          dob: data.dob ? new Date(data.dob) : internship!.studentProfile!.dob,
          phoneNumber: data.phoneNumber,
          contactAddress: data.contactAddress,
          emergencyPhone: data.emergencyPhone,
          guardianName: data.guardianName,
          guardianRelationship: data.guardianRelationship,
          educationLevel: data.educationLevel,
          institution: data.institution,
          faculty: data.faculty ?? internship!.studentProfile!.faculty,
          major: data.major ?? internship!.studentProfile!.major,
          advisorName: data.advisorName,
          advisorPhone: data.advisorPhone,
        }
        : internship!.studentProfile,
    });

    // APPROVED path — save with audit log
    if (internship.status === "APPROVED") {
      startTransition(async () => {
        const result = await updateApprovedStudentInfo(
          profile.userId,
          internship!.id,
          data
        );
        if (result.success) {
          setIsEditMode(false);
          onUpdate?.(buildUpdated());
          if (result.changes && result.changes.length > 0) {
            toast.success(`บันทึกข้อมูลเรียบร้อย (${result.changes.length} ช่องถูกแก้ไข)`);
          } else {
            toast.success("ไม่มีการเปลี่ยนแปลง");
          }
        } else {
          toast.error(result.error || "ไม่สามารถบันทึกข้อมูลได้");
        }
      });
      return;
    }

    // Normal (non-approved) path
    startTransition(async () => {
      const result = await updateStudentAndInternshipInfo(
        profile.userId,
        internship!.id,
        data
      );
      if (result.success) {
        setIsEditMode(false);
        onUpdate?.(buildUpdated());
      } else {
        toast.error(result.error || "ไม่สามารถบันทึกข้อมูลได้");
      }
    });
  };

  const handleSubmitReview = () => {
    if (!internship?.id) return;
    startTransition(async () => {
      // 1. Sync ALL file statuses to DB
      await Promise.all(
        files.map((file) => {
          const review = fileReviews[file.id];
          const newStatus = review?.status ?? file.status;
          const newReason = review?.status === "REJECTED" ? (review.reason || file.rejectReason) : null;
          
          return fetch(`/api/admin/attachments/${file.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus, rejectReason: newReason }),
          });
        })
      );

      // 2. Determine final internship status
      // If ANY file is REJECTED (either existing in DB or newly set in local state), the whole thing is REJECTED.
      // Else if ALL are APPROVED, then APPROVED.
      const hasAnyRejected = files.some(f => (fileReviews[f.id]?.status ?? f.status) === "REJECTED");
      const finalStatus = hasAnyRejected ? "REJECTED" : "APPROVED";
      
      await updateInternshipStatus(internship.id, finalStatus, "");
      onClose();
      router.refresh();
    });
  };

  const handleCompleteInternship = () => {
    if (!internship?.id || !requiredStudentName) return;

    if (normalizeName(confirmFullName) !== normalizeName(requiredStudentName)) {
      setConfirmNameError("ชื่อ-นามสกุลไม่ถูกต้อง");
      return;
    }

    startTransition(async () => {
      const result = await updateInternshipStatus(internship.id, "COMPLETED", "");
      if (!result.success) {
        toast.error(result.error || "ไม่สามารถเปลี่ยนสถานะได้");
        return;
      }
      setIsCompleteDialogOpen(false);
      setConfirmFullName("");
      setConfirmNameError(null);
      onClose();
      router.refresh();
    });
  };

  const handleRevertToApproved = () => {
    if (!internship?.id) return;
    if (
      confirm(
        "คุณต้องการเปลี่ยนสถานะกลับเป็น 'อนุมัติแล้ว' ใช่หรือไม่?\n\nการดำเนินการนี้จะช่วยให้นักศึกษาสามารถเริ่มนับเวลาฝึกงานต่อได้ (กรณีขยายเวลา)"
      )
    ) {
      startTransition(async () => {
        const result = await manualRevertToApproved(internship!.id);
        if (result.success) {
          onClose();
        } else {
          alert(result.error || "ไม่สามารถเปลี่ยนสถานะได้");
        }
      });
    }
  };

  const avatarUrl = profile?.profilePictureUrl
    ? profile.profilePictureUrl
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(fullName)}&backgroundColor=b6e3f4`;

  const handleSendBack = () => {
    if (!internship?.id) return;

    // EDIT_REQUESTED path: revert to snapshot and set status back to APPROVED.
    if (internship.status === "EDIT_REQUESTED") {
      startTransition(async () => {
        const result = await revertEditRequestedToApproved(internship.id);
        if (!result.success) {
          toast.error(result.error || "ไม่สามารถย้อนข้อมูลได้");
          return;
        }
        onClose();
        router.refresh();
      });
      return;
    }

    // 1. Validate Personal Info Flags (Step 1)
    const firstEmptyFlag = Object.entries(rejectionReasons).find(
      ([, v]) => v.flagged && !v.reason.trim()
    );

    if (firstEmptyFlag) {
      toast.error("กรุณากรอกข้อมูลใน field ข้อมูล");
      setActiveTab("info");
      // Focus after tab switch and render
      setTimeout(() => {
        document.getElementById(`reason-field-${firstEmptyFlag[0]}`)?.focus();
      }, 100);
      return;
    }

    // 2. Validate Document Rejections (Step 2)
    const firstEmptyFile = Object.entries(fileReviews).find(
      ([, v]) => v.status === "REJECTED" && !v.reason.trim()
    );

    if (firstEmptyFile) {
      toast.error("กรุณากรอกข้อมูลใน field ข้อมูล");
      // Switch to documents view if we are on info tab
      if (activeTab === "info" && files.length > 0) {
        setActiveTab(files[0].id);
      }
      setTimeout(() => {
        document.getElementById(`reason-doc-${firstEmptyFile[0]}`)?.focus();
      }, 100);
      return;
    }

    // Prepare meaningful remarks summary
    const FIELD_LABELS: Record<string, string> = {
      prefix: "คำนำหน้า",
      firstNameTh: "ชื่อ",
      lastNameTh: "นามสกุล",
      gender: "เพศ",
      dob: "วันเกิด",
      phoneNumber: "เบอร์โทรศัพท์",
      contactAddress: "ที่อยู่",
      emergencyPhone: "เบอร์โทรศัพท์ผู้ปกครอง",
      guardianName: "ชื่อผู้ปกครอง",
      guardianRelationship: "ความสัมพันธ์",
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

    const personalFeedback = Object.entries(rejectionReasons)
      .filter(([, v]) => v.flagged)
      .map(([field, v]) => `${FIELD_LABELS[field] || field}: ${v.reason}`);

    const docFeedback = Object.entries(fileReviews)
      .filter(([, v]) => v.status === "REJECTED")
      .map(([id, v]) => {
        const file = files.find((f) => f.id === id);
        return `เอกสาร ${file?.fileName || "ไม่ทราบชื่อ"}: ${v.reason}`;
      });

    const allFeedback = [...personalFeedback, ...docFeedback].join(" | ");
    const remarks = allFeedback || "กรุณาแก้ไขข้อมูลตามที่ระบุ";

    startTransition(async () => {
      await updateInternshipStatus(internship.id, "REJECTED", remarks);

      console.log("fileReviews:", fileReviews);
      console.log("files to update:", Object.entries(fileReviews).filter(([, v]) => v.status === "REJECTED" || v.status === "APPROVED"));

      // 2. Sync ALL file statuses to DB
      await Promise.all(
        files.map((file) => {
          const review = fileReviews[file.id];
          const newStatus = review?.status ?? file.status;
          const newReason = review?.status === "REJECTED" ? (review.reason || file.rejectReason) : null;
          
          return fetch(`/api/admin/attachments/${file.id}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: newStatus, rejectReason: newReason }),
          });
        })
      );

      onClose();
      router.refresh();
    });
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  const visible = isOpen && !!internship;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${visible ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${visible ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        {internship && (
          <div
            className="relative w-full max-w-6xl h-[96vh] bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── Header ── */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#F5EFF9] rounded-full flex items-center justify-center shrink-0 border-2 border-[#E5D5F0] overflow-hidden">
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h2 className="text-[22px] font-extrabold text-gray-900 leading-tight">
                      {fullName}
                    </h2>
                    {/* Status badge — inline with name */}
                    <span className={`shrink-0 px-3 py-1 rounded-full text-xs font-black border ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-1 text-sm font-medium text-gray-500">
                    <span>สาขา {profile?.major || "N/A"}</span>
                    {profile?.user?.email && (
                      <>
                        <span className="mx-1">|</span>
                        <span>{profile.user.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {internship.status !== "COMPLETED" && currentStep === 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (isEditMode) {
                        reset();
                        setIsEditMode(false);
                      } else {
                        setIsEditMode(true);
                      }
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${isEditMode
                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                        : "bg-[#F5EFF9] text-[#9E76B4] hover:bg-[#EDE0F5]"
                      }`}
                  >
                    {isEditMode ? (
                      <><RotateCcw className="w-4 h-4" />ยกเลิกการแก้ไข</>
                    ) : (
                      <><Edit2 className="w-4 h-4" />แก้ไขข้อมูล</>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors outline-none"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* ── Step Progress ── */}
            <div className="border-b border-gray-200 bg-white shrink-0 px-6 py-4">
              <div className="flex items-start mx-auto" style={{ width: 480 }}>
                {/* Step 1 */}
                <button
                  type="button"
                  onClick={() => { if (currentStep === 2) setActiveTab("info"); }}
                  disabled={currentStep === 1}
                  className={`flex flex-col items-center gap-1.5 shrink-0 ${currentStep === 2 ? "cursor-pointer" : "cursor-default"}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black transition-colors ${currentStep === 2 ? "bg-green-500 text-white" : "bg-[#534AB7] text-white"
                    }`}>
                    {currentStep === 2 ? <Check className="w-4 h-4" /> : "1"}
                  </div>
                  <span className={`text-[12px] font-bold whitespace-nowrap transition-colors ${currentStep === 2 ? "text-green-600" : "text-[#534AB7]"
                    }`}>
                    ข้อมูลส่วนตัว
                  </span>
                </button>

                {/* Connector — stretches full width between the two circles */}
                <div className="flex-1 mt-4 mx-3">
                  <div className={`h-0.5 w-full transition-colors ${currentStep === 2 ? "bg-green-400" : "bg-gray-200"}`} />
                </div>

                {/* Step 2 */}
                <button
                  type="button"
                  onClick={() => {
                    if (currentStep === 1) {
                      if (files.length > 0) setActiveTab(files[0].id);
                      else setActiveTab("docs-empty");
                    }
                  }}
                  disabled={currentStep === 2 || !["APPROVED", "COMPLETED"].includes(internship.status)}
                  className={`flex flex-col items-center gap-1.5 shrink-0 ${
                    currentStep === 1 && ["APPROVED", "COMPLETED"].includes(internship.status)
                      ? "cursor-pointer"
                      : "cursor-default"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-black border-2 transition-colors ${currentStep === 2
                      ? "bg-[#534AB7] text-white border-[#534AB7]"
                      : "bg-white text-gray-400 border-gray-300"
                    }`}>
                    2
                  </div>
                  <span className={`text-[12px] font-bold whitespace-nowrap transition-colors ${currentStep === 2 ? "text-[#534AB7]" : "text-gray-400"
                    }`}>
                    เอกสาร
                  </span>
                </button>
              </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-hidden bg-[#f8f9fc] relative flex flex-col">

              {currentStep === 1 ? (
                // ── Info Tab ──
                <form
                  onSubmit={handleSubmit(onSaveInfo)}
                  className="w-full h-full overflow-y-auto p-8 flex flex-col items-center gap-6"
                >
                  <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col gap-6">
                    {/* Header row */}
                    <div className="flex items-center justify-between border-b border-gray-300 pb-4">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-black text-gray-900">ข้อมูลการขอฝึกงาน</h3>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-100 rounded-xl text-xs text-orange-500 font-medium">
                          <Info className="h-4 w-4 shrink-0" />
                          <span>คลิกช่องที่ต้องการเพื่อทำเครื่องหมายส่งกลับให้นักศึกษาแก้ไข</span>
                        </div>
                      </div>
                      {isEditMode && (
                        <span className="text-[10px] font-black uppercase tracking-widest bg-[#F5EFF9] text-[#9E76B4] px-3 py-1 rounded-full">
                          Editing Mode
                        </span>
                      )}
                    </div>

                    {/* ── Diff Banner for EDIT_REQUESTED ── */}
                    {snapshot && (() => {
                      const fieldLabels: Record<string, string> = {
                        // Personal info
                        prefix: "คำนำหน้า", firstNameTh: "ชื่อ", lastNameTh: "นามสกุล",
                        gender: "เพศ", dob: "วันเกิด", phoneNumber: "เบอร์โทรศัพท์",
                        emergencyPhone: "เบอร์โทรศัพท์ผู้ปกครอง", contactAddress: "ที่อยู่",
                        guardianName: "ชื่อผู้ปกครอง", guardianRelationship: "ความสัมพันธ์",
                        // Education info
                        educationLevel: "ระดับการศึกษา", institution: "สถาบัน",
                        faculty: "คณะ", major: "สาขา", advisorName: "อาจารย์ที่ปรึกษา", advisorPhone: "เบอร์อาจารย์",
                        // Internship info
                        position: "ตำแหน่ง", department: "หน่วยงาน", company: "บริษัท",
                        supervisorName: "ผู้ดูแล", startDate: "วันเริ่มฝึกงาน", endDate: "วันสิ้นสุดฝึกงาน",
                        remarks: "หมายเหตุ",
                      };
                      const isChangedLocal = (snapshot: any, key: string, current: any) => {
                        if (!snapshot) return false;
                        let prev = snapshot[key] ?? null;
                        let cur = current ?? null;

                        // Normalize dates for comparison
                        if (prev && (key === 'dob' || key === 'startDate' || key === 'endDate')) {
                          try { prev = new Date(prev).toISOString().split('T')[0]; } catch { }
                        }
                        if (cur && (key === 'dob' || key === 'startDate' || key === 'endDate')) {
                          try { cur = new Date(cur).toISOString().split('T')[0]; } catch { }
                        }

                        return String(prev ?? '') !== String(cur ?? '');
                      };

                      const currentValues: Record<string, any> = {
                        prefix: profile?.prefix,
                        firstNameTh: profile?.firstNameTh,
                        lastNameTh: profile?.lastNameTh,
                        gender: profile?.gender,
                        dob: profile?.dob,
                        phoneNumber: profile?.phoneNumber,
                        emergencyPhone: profile?.emergencyPhone,
                        contactAddress: profile?.contactAddress,
                        guardianName: profile?.guardianName,
                        guardianRelationship: profile?.guardianRelationship,
                        educationLevel: profile?.educationLevel,
                        institution: profile?.institution,
                        faculty: profile?.faculty,
                        major: profile?.major,
                        advisorName: profile?.advisorName,
                        advisorPhone: profile?.advisorPhone,
                        position: internship!.position,
                        department: internship!.department,
                        company: internship!.company,
                        supervisorName: internship!.supervisorName,
                        startDate: internship!.startDate,
                        endDate: internship!.endDate,
                        remarks: internship!.remarks,
                      };

                      const changedFields = Object.keys(fieldLabels).filter((k) =>
                        isChangedLocal(snapshot, k, currentValues[k])
                      );
                      
                      const hasPending = files.some(f => (fileReviews[f.id]?.status ?? f.status) === "PENDING");

                      if (changedFields.length === 0 && !hasPending) return null;
                      
                      return (
                        <div className="flex flex-col gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <div className="flex flex-col gap-1">
                              <p className="text-sm font-bold text-amber-800">นักศึกษาแก้ไขข้อมูลแล้ว — รอตรวจสอบ</p>
                              {changedFields.length > 0 && (
                                <p className="text-xs text-amber-700">
                                  ช่องที่เปลี่ยนแปลง: {changedFields.map((k) => fieldLabels[k]).join(", ")}
                                </p>
                              )}
                            </div>
                          </div>
                          {hasPending && (
                            <div className="flex items-center gap-2 mt-1 px-3 py-1.5 bg-orange-100/50 rounded-lg border border-orange-200 text-[11px] text-orange-700 font-bold">
                              <FileText className="w-3.5 h-3.5" />
                              มีเอกสารใหม่รอการตรวจสอบ กรุณาตรวจเอกสารในส่วนที่ 2
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* ── Section 1: Personal ── */}
                    <SectionLabel>ข้อมูลส่วนตัว</SectionLabel>

                    <div className="flex items-stretch gap-6">
                      {/* Left: avatar — stretches to match right column height */}
                      <div className="w-56 shrink-0 flex flex-col">
                        <div className="flex-1 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center">
                          <img
                            src={avatarUrl}
                            alt="รูปโปรไฟล์"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>

                      {/* Right: fields */}
                      <div className="flex-1 grid grid-cols-6 gap-4">
                        {/* Row 1: คำนำหน้า(2) | ชื่อ(2) | นามสกุล(2) */}
                        <div className="col-span-2 flex flex-col gap-2">
                          <FieldLabel required>คำนำหน้า</FieldLabel>
                          {isEditMode ? (
                            <Controller
                              name="prefix"
                              control={control}
                              render={({ field }) => (
                                <AdminCustomListbox
                                  options={["นาย", "นางสาว", "นาง"]}
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="เลือก..."
                                  error={errors.prefix}
                                />
                              )}
                            />
                          ) : (
                            <FlaggedFieldWrapper fieldKey="prefix" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                              <ReadonlyField value={profile?.prefix} />
                            </FlaggedFieldWrapper>
                          )}
                          {errors.prefix && <span className="text-[11px] text-red-500 font-bold">{errors.prefix.message}</span>}
                        </div>

                        <div className="col-span-2 flex flex-col gap-2">
                          <FieldLabel required>ชื่อ (ภาษาไทย)</FieldLabel>
                          {isEditMode ? (
                            <input {...register("firstNameTh")} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                          ) : (
                            <FlaggedFieldWrapper fieldKey="firstNameTh" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                              <ReadonlyField value={profile?.firstNameTh} />
                            </FlaggedFieldWrapper>
                          )}
                        </div>

                        <div className="col-span-2 flex flex-col gap-2">
                          <FieldLabel required>นามสกุล (ภาษาไทย)</FieldLabel>
                          {isEditMode ? (
                            <input {...register("lastNameTh")} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                          ) : (
                            <FlaggedFieldWrapper fieldKey="lastNameTh" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                              <ReadonlyField value={profile?.lastNameTh} />
                            </FlaggedFieldWrapper>
                          )}
                        </div>

                        {/* Row 2: เพศ(3) | วันเกิด(3) */}
                        <div className="col-span-3 flex flex-col gap-2">
                          <FieldLabel required>เพศ</FieldLabel>
                          {isEditMode ? (
                            <Controller
                              name="gender"
                              control={control}
                              render={({ field }) => (
                                <AdminCustomListbox
                                  options={["ชาย", "หญิง", "อื่นๆ"]}
                                  value={field.value}
                                  onChange={field.onChange}
                                  placeholder="เลือก..."
                                  error={errors.gender}
                                />
                              )}
                            />
                          ) : (
                            <FlaggedFieldWrapper fieldKey="gender" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                              <ReadonlyField value={profile?.gender} />
                            </FlaggedFieldWrapper>
                          )}
                          {errors.gender && <span className="text-[11px] text-red-500 font-bold">{errors.gender.message}</span>}
                        </div>

                        <div className="col-span-3 flex flex-col gap-2">
                          <FieldLabel required>วันเกิด</FieldLabel>
                          {isEditMode ? (
                            <input type="date" {...register("dob")} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                          ) : (
                            <FlaggedFieldWrapper fieldKey="dob" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                              <ReadonlyField
                                value={hasMounted && profile?.dob ? new Date(profile.dob).toLocaleDateString("th-TH") : undefined}
                              />
                            </FlaggedFieldWrapper>
                          )}
                        </div>

                        {/* Row 3: เบอร์โทรศัพท์(3) | อีเมล(3) */}
                        <div className="col-span-3 flex flex-col gap-2">
                          <FieldLabel required>เบอร์โทรศัพท์</FieldLabel>
                          {isEditMode ? (
                            <input {...register("phoneNumber")} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                          ) : (
                            <FlaggedFieldWrapper fieldKey="phoneNumber" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                              <ReadonlyField value={profile?.phoneNumber} />
                            </FlaggedFieldWrapper>
                          )}
                          {errors.phoneNumber && <span className="text-[11px] text-red-500 font-bold">{errors.phoneNumber.message}</span>}
                        </div>

                        <div className="col-span-3 flex flex-col gap-2">
                          <FieldLabel>อีเมลมหาวิทยาลัย</FieldLabel>
                          <ReadonlyField value={profile?.user?.email} />
                        </div>
                      </div>
                    </div>{/* end photo + fields flex */}

                    {/* ที่อยู่ — full width below */}
                    <div className="flex flex-col gap-2">
                      <FieldLabel required>ที่อยู่ที่สามารถติดต่อได้</FieldLabel>
                      {isEditMode ? (
                        <textarea {...register("contactAddress")} rows={2} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all resize-none" />
                      ) : (
                        <FlaggedFieldWrapper fieldKey="contactAddress" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                          <ReadonlyField value={profile?.contactAddress} />
                        </FlaggedFieldWrapper>
                      )}
                    </div>

                    {/* ── Sub-section: ผู้ปกครอง ── */}
                    <SectionLabel>ข้อมูลผู้ปกครอง</SectionLabel>

                    <div className="grid grid-cols-12 gap-x-4 gap-y-5">
                      <div className="col-span-5 flex flex-col gap-2">
                        <FieldLabel>ชื่อ-นามสกุลผู้ปกครอง</FieldLabel>
                        {isEditMode ? (
                          <input {...register("guardianName")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" placeholder="เช่น นาย ชื่อ นามสกุล" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="guardianName" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.guardianName} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="col-span-3 flex flex-col gap-2">
                        <FieldLabel>ความสัมพันธ์</FieldLabel>
                        {isEditMode ? (
                          <input {...register("guardianRelationship")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" placeholder="เช่น บิดา, มารดา" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="guardianRelationship" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.guardianRelationship} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="col-span-4 flex flex-col gap-2">
                        <FieldLabel required>เบอร์โทรศัพท์ผู้ปกครอง</FieldLabel>
                        {isEditMode ? (
                          <input {...register("emergencyPhone")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="emergencyPhone" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.emergencyPhone} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>
                    </div>

                    {/* ── Section 2: Education ── */}
                    <SectionLabel>ข้อมูลการศึกษา</SectionLabel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-2">
                        <FieldLabel required>ระดับการศึกษา</FieldLabel>
                        {isEditMode ? (
                          <Controller
                            name="educationLevel"
                            control={control}
                            render={({ field }) => (
                              <AdminCustomListbox
                                options={["ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"]}
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="เลือกระดับการศึกษา..."
                                error={errors.educationLevel}
                              />
                            )}
                          />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="educationLevel" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.educationLevel} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <FieldLabel required>สถาบัน</FieldLabel>
                        {isEditMode ? (
                          <input {...register("institution")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="institution" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.institution} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <FieldLabel>คณะ</FieldLabel>
                        {isEditMode ? (
                          <input {...register("faculty")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="faculty" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.faculty} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <FieldLabel required>สาขา</FieldLabel>
                        {isEditMode ? (
                          <input {...register("major")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="major" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.major} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <FieldLabel>ชื่อ-นามสกุล อาจารย์ที่ปรึกษาสหกิจ</FieldLabel>
                        {isEditMode ? (
                          <input {...register("advisorName")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="advisorName" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.advisorName} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="flex flex-col gap-2">
                        <FieldLabel>เบอร์โทรศัพท์อาจารย์ที่ปรึกษาสหกิจ</FieldLabel>
                        {isEditMode ? (
                          <input {...register("advisorPhone")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="advisorPhone" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={profile?.advisorPhone} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>
                    </div>

                    {/* ── Section 3: Internship ── */}
                    <SectionLabel>รายละเอียดการฝึกงาน</SectionLabel>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                      {/* ตำแหน่ง | วันเริ่ม | วันสิ้นสุด */}
                      <div className="md:col-span-6 flex flex-col gap-2">
                        <FieldLabel required>ตำแหน่งที่ฝึกงาน</FieldLabel>
                        {isEditMode ? (
                          <input {...register("position")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" placeholder="ค้นหาหรือพิมพ์ตำแหน่ง..." />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="position" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={internship.position} />
                          </FlaggedFieldWrapper>
                        )}
                        {errors.position && <span className="text-[11px] text-red-500 font-bold">{errors.position.message}</span>}
                      </div>

                      <div className="md:col-span-3 flex flex-col gap-2">
                        <FieldLabel required>วันที่เริ่มฝึกงาน</FieldLabel>
                        {isEditMode ? (
                          <input type="date" {...register("startDate")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="startDate" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField
                              value={
                                hasMounted && internship.startDate
                                  ? new Date(internship.startDate).toLocaleDateString("th-TH")
                                  : undefined
                              }
                            />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="md:col-span-3 flex flex-col gap-2">
                        <FieldLabel required>วันที่สิ้นสุดฝึกงาน</FieldLabel>
                        {isEditMode ? (
                          <input type="date" {...register("endDate")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="endDate" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField
                              value={
                                hasMounted && internship.endDate
                                  ? new Date(internship.endDate).toLocaleDateString("th-TH")
                                  : undefined
                              }
                            />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      {/* หน่วยงาน | ผู้ดูแล */}
                      <div className="md:col-span-6 flex flex-col gap-2">
                        <FieldLabel required>หน่วยงานที่ไปฝึก</FieldLabel>
                        {isEditMode ? (
                          <input {...register("department")} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all" placeholder="ค้นหาหรือพิมพ์ชื่อแผนก..." />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="department" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={internship.department} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>

                      <div className="md:col-span-6 flex flex-col gap-2">
                        <FieldLabel>ชื่อ-นามสกุลผู้ดูแล</FieldLabel>
                        {isEditMode ? (
                          <Controller
                            name="supervisorName"
                            control={control}
                            render={({ field }) => (
                              <AdminSearchableSelect
                                options={
                                  admins?.map((a: any) => {
                                    const p = a.adminProfile;
                                    return p?.firstNameTh && p?.lastNameTh
                                      ? `${p.firstNameTh} ${p.lastNameTh}`.trim()
                                      : a.email;
                                  }) ?? []
                                }
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="พิมพ์ชื่อผู้ดูแลหรือเลือกจากรายชื่อ..."
                                freeText
                                error={errors.supervisorName}
                              />
                            )}
                          />
                        ) : (
                          <FlaggedFieldWrapper fieldKey="supervisorName" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                            <ReadonlyField value={internship.supervisorName} />
                          </FlaggedFieldWrapper>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <FieldLabel>รายละเอียดเพิ่มเติม</FieldLabel>
                      {isEditMode ? (
                        <textarea {...register("remarks")} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#9E76B4] focus:ring-4 focus:ring-[#9E76B4]/5 transition-all resize-none" />
                      ) : (
                        <FlaggedFieldWrapper fieldKey="remarks" rejectionReasons={rejectionReasons} onToggle={toggleFlag} onReasonChange={setFlagReason} disabled={flagDisabled}>
                          <ReadonlyField value={internship.remarks} />
                        </FlaggedFieldWrapper>
                      )}
                    </div>
                  </div>

                  {isEditMode && (
                    <button
                      type="submit"
                      disabled={isPending || !isDirty}
                      className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-[#C4A0D4] to-[#9E76B4] text-white font-black rounded-2xl shadow-lg hover:brightness-95 transition-all disabled:opacity-50 active:scale-[0.98]"
                    >
                      {isPending ? (
                        "กำลังบันทึกข้อมูล..."
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          SAVE CHANGES
                        </>
                      )}
                    </button>
                  )}
                </form>
              ) : (
                // ── Document List ──
                <div className="w-full h-full overflow-y-auto p-6 flex flex-col gap-3">
                  {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                      <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <FileText className="w-10 h-10 text-gray-200" />
                      </div>
                      <h4 className="text-xl font-black text-gray-900">ไม่มีไฟล์แนบ</h4>
                      <p className="text-gray-400 font-medium mt-1">ไม่พบไฟล์เอกสารในคำร้องนี้</p>
                    </div>
                  ) : (
                    files.map((file) => {
                      const isPdf =
                        file.fileType?.toLowerCase().includes("pdf") ||
                        file.fileName?.toLowerCase().endsWith(".pdf");
                      const FileIcon = isPdf ? FileText : ImageIcon;
                      const reviewStatus = fileReviews[file.id]?.status;
                      const isApproved = reviewStatus === "APPROVED";
                      const isRejected = reviewStatus === "REJECTED";
                      const isPending = !reviewStatus || reviewStatus === "PENDING";
                      return (
                        <div key={file.id} className="flex flex-col">
                          {/* File row */}
                          <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl px-5 py-4 shadow-sm">
                            {/* Status dot */}
                            <div className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors ${["APPROVED", "COMPLETED"].includes(internship.status) || isApproved
                                ? "bg-green-500"
                                : isRejected
                                  ? "bg-red-500"
                                  : "bg-gray-300"
                              }`} />
                            {/* File icon */}
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isPdf ? "bg-red-50" : "bg-blue-50"}`}>
                              <FileIcon className={`w-5 h-5 ${isPdf ? "text-red-500" : "text-blue-500"}`} />
                            </div>
                            {/* Name + type + DB status badge */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-gray-900 truncate">{file.fileName}</p>
                                {isApproved && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-green-100 text-green-700 border border-green-200">ผ่านแล้ว</span>
                                )}
                                {isRejected && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700 border border-red-200">ไม่ผ่าน</span>
                                )}
                                {isPending && (
                                  <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-100 text-gray-500 border border-gray-200">รอตรวจสอบ</span>
                                )}
                              </div>
                              {isRejected && (fileReviews[file.id]?.reason || file.rejectReason) && (
                                <p className="text-xs text-red-500 font-medium mt-1 italic">
                                  เหตุผล: {fileReviews[file.id]?.reason || file.rejectReason}
                                </p>
                              )}
                              <p className="text-xs text-gray-400 mt-0.5">{file.fileType || "ไฟล์แนบ"}</p>
                            </div>
                            {/* Actions */}
                            <div className="flex items-center gap-2 shrink-0">
                              <a
                                href={file.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 text-[12px] font-bold hover:bg-gray-50 transition-colors"
                              >
                                <Download className="w-3.5 h-3.5" />
                                ดาวน์โหลด
                              </a>
                              {!["APPROVED", "COMPLETED"].includes(internship.status) && (
                                <>
                                  <button
                                    type="button"
                                    
                                    onClick={() => {
                                      const newStatus = isRejected ? "PENDING" : "REJECTED";
                                      setFileReviews((prev) => ({
                                        ...prev,
                                        [file.id]: { ...prev[file.id], status: newStatus },
                                      }));
                                      fetch(`/api/admin/attachments/${file.id}/status`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({
                                          status: newStatus,
                                          rejectReason: newStatus === "REJECTED" ? (fileReviews[file.id]?.reason || null) : null
                                        }),
                                      });
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${isRejected
                                        ? "bg-red-500 text-white border border-red-500"
                                        : "border border-red-300 text-red-500 hover:bg-red-50"
                                      }`}
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    Reject
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newStatus = isApproved ? "PENDING" : "APPROVED";
                                      setFileReviews((prev) => ({
                                        ...prev,
                                        [file.id]: { status: newStatus, reason: "" },
                                      }));
                                      fetch(`/api/admin/attachments/${file.id}/status`, {
                                        method: "PATCH",
                                        headers: { "Content-Type": "application/json" },
                                        body: JSON.stringify({ status: newStatus, rejectReason: null }),
                                      });
                                    }}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold transition-all ${isApproved
                                        ? "bg-green-500 text-white border border-green-500"
                                        : "border border-green-400 text-green-600 hover:bg-green-50"
                                      }`}
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                    Approve
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                          {/* Inline rejection reason */}
                          {isRejected && (
                            <div className="mt-1 ml-8 border-l-4 border-red-400 pl-4 py-3 pr-4 bg-red-50 rounded-r-xl">
                              <p className="text-[11px] font-black text-red-600 uppercase tracking-wider mb-1.5">ระบุเหตุผลการตีกลับ</p>
                              <textarea
                                id={`reason-doc-${file.id}`}
                                value={fileReviews[file.id]?.reason || ""}
                                onChange={(e) =>
                                  setFileReviews((prev) => ({
                                    ...prev,
                                    [file.id]: { ...prev[file.id], reason: e.target.value },
                                  }))
                                }
                                placeholder="ตัวอย่าง: ข้อมูลไม่ชัดเจน, ไฟล์อ่านไม่ได้..."
                                rows={2}
                                className="w-full rounded-lg border-none bg-white/70 px-3 py-2 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-red-200 resize-none font-medium placeholder:text-red-300"
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="px-6 py-3 bg-white border-t border-gray-100 shrink-0 flex flex-col gap-3">
              {/* Status notice if already finalized */}
              {["APPROVED", "EDIT_REQUESTED", "COMPLETED"].includes(internship.status) && (
                <div
                  className={`p-4 rounded-2xl flex flex-col items-center gap-2 font-black text-sm border shadow-sm ${
                    internship.status === "EDIT_REQUESTED"
                      ? "bg-blue-50 text-blue-600 border-blue-100"
                      : "bg-green-50 text-green-600 border-green-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {internship.status === "EDIT_REQUESTED" ? (
                      <><Clock className="w-5 h-5" /> คำร้องนี้กำลังรอการตรวจสอบแก้ไข</>
                    ) : internship.status === "COMPLETED" ? (
                      <><CheckCircle2 className="w-5 h-5" /> การฝึกงานเสร็จสมบูรณ์</>
                    ) : (
                      <><CheckCircle2 className="w-5 h-5" /> คำร้องนี้ได้รับการอนุมัติแล้ว</>
                    )}
                  </div>


                </div>
              )}

              {/* Action buttons */}
              {internship.status === "APPROVED" ? (
                <button
                  type="button"
                  onClick={() => {
                    setConfirmNameError(null);
                    setConfirmFullName("");
                    setIsCompleteDialogOpen(true);
                  }}
                  disabled={isPending}
                  className="w-full px-6 py-3 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-600 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  สำเร็จการฝึกงาน
                </button>
              ) : !["COMPLETED"].includes(internship.status) ? (
                internship.status === "EDIT_REQUESTED" ? (
                  // Special case: EDIT_REQUESTED — show both buttons to approve/reject edits
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={handleSendBack}
                      disabled={isPending}
                      className="px-6 py-2.5 rounded-xl border border-red-400 text-red-500 text-sm font-black bg-transparent hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ยกเลิกการแก้ไข
                    </button>
                    <div className="relative group">
                      <button
                        type="button"
                        onClick={handleSubmitReview}
                        disabled={isPending || hasRejectionReasons || hasPendingDocs}
                        className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-black hover:bg-emerald-600 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPending ? "กำลังบันทึก..." : "ยอมรับการแก้ไข"}
                      </button>
                      {hasPendingDocs && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-[10px] rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          กรุณาตรวจสอบเอกสารให้ครบก่อน
                        </div>
                      )}
                    </div>
                  </div>
                ) : currentStep === 1 ? (
                  <div className="flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        if (files.length > 0) setActiveTab(files[0].id);
                        else setActiveTab("docs-empty");
                      }}
                      disabled={isPending}
                      className="px-6 py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-black hover:bg-[#4840a3] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ขั้นตอนต่อไป
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setActiveTab("info")}
                      disabled={isPending}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-gray-300 text-gray-600 text-sm font-black bg-transparent hover:bg-gray-50 transition-colors active:scale-95 disabled:opacity-50"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      แก้ไขข้อมูล
                    </button>
                    <div className="flex-1" />
                      <button
                        type="button"
                        onClick={() => handleSendBack()}
                        disabled={isPending || (!hasRejectionReasons && !files.some((f) => fileReviews[f.id]?.status === "REJECTED"))}
                        className="px-6 py-2.5 rounded-xl border border-red-400 text-red-500 text-sm font-black bg-transparent hover:bg-red-50 transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                      ส่งกลับแก้ไข
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmitReview}
                      disabled={isPending || !canProceed || hasRejectionReasons || files.length === 0}
                      className="px-6 py-2.5 rounded-xl bg-[#534AB7] text-white text-sm font-black hover:bg-[#4840a3] transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? "กำลังบันทึก..." : "ยอมรับเข้าฝึกงาน"}
                    </button>
                  </div>
                )
              ) : null}
            </div>

            <Dialog
              open={isCompleteDialogOpen}
              onOpenChange={(open) => {
                setIsCompleteDialogOpen(open);
                if (!open) {
                  setConfirmFullName("");
                  setConfirmNameError(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>สำเร็จการฝึกงาน</DialogTitle>
                  <DialogDescription>
                    กรุณากรอกชื่อ-นามสกุลนักศึกษาเพื่อยืนยัน
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-2">
                  <input
                    value={confirmFullName}
                    onChange={(e) => {
                      setConfirmFullName(e.target.value);
                      if (confirmNameError) setConfirmNameError(null);
                    }}
                    placeholder="ชื่อ-นามสกุลนักศึกษา"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                  {confirmNameError && (
                    <span className="text-xs font-bold text-red-500">{confirmNameError}</span>
                  )}
                </div>

                <DialogFooter>
                  <button
                    type="button"
                    onClick={() => setIsCompleteDialogOpen(false)}
                    className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="button"
                    onClick={handleCompleteInternship}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-emerald-500 text-sm font-bold text-white hover:bg-emerald-600 disabled:opacity-50"
                  >
                    ยืนยัน
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

    </>
  );
}
