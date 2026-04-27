"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  ChevronDown,
  Check,
  AlertCircle,
  CalendarIcon,
  Lock,
  Pencil,
  Info,
  FileText,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { submitInternshipApplication } from "@/app/actions/internship";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

interface StudentProfile {
  prefix: string;
  firstNameTh: string;
  lastNameTh: string;
  gender: string | null;
  dob: Date | null;
  phoneNumber: string | null;
  emergencyPhone: string | null;
  contactAddress: string | null;
  profilePictureUrl: string | null;
  guardianName: string | null;
  guardianRelationship: string | null;
  advisorName: string | null;
  advisorPhone: string | null;
  educationLevel?: string | null;
  institution?: string | null;
  faculty?: string | null;
  major?: string | null;
}

interface InternshipData {
  id: string;
  position: string;
  department: string | null;
  company: string | null;
  supervisorName: string | null;
  startDate: Date;
  endDate: Date;
  status: string;
  remarks: string | null;
}

interface InternshipFormProps {
  initialProfile: StudentProfile | null;
  initialInternship: InternshipData | null;
  email: string | null;
}

// ─── SearchableCombobox (free-text + dropdown) ───────────────────────────────

function SearchableCombobox({
  name,
  options,
  defaultValue,
  disabled,
  placeholder,
  freeText = false,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
  freeText?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(defaultValue || "");

  const filtered =
    query === ""
      ? options
      : options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));

  return (
    <Combobox
      value={selected}
      onChange={(val) => val && setSelected(val)}
      disabled={disabled}
    >
      <div className="relative w-full">
        <input type="hidden" name={name} value={selected} />
        <ComboboxInput
          className="w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] pr-10 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
          displayValue={(item: string) => item}
          onChange={(e) => {
            setQuery(e.target.value);
            if (freeText) setSelected(e.target.value);
          }}
          placeholder={placeholder}
          autoComplete="off"
        />
        <ComboboxButton className="absolute inset-y-0 right-0 flex items-center pr-2">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </ComboboxButton>
        <ComboboxOptions className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none">
          {filtered.length === 0 && query !== "" ? (
            freeText ? (
              <ComboboxOption
                value={query}
                className="cursor-pointer select-none py-2 px-4 text-gray-700 bg-gray-50 hover:bg-gray-100"
              >
                ใช้ค่าที่ระบุ: &quot;{query}&quot;
              </ComboboxOption>
            ) : (
              <div className="cursor-default select-none py-2 px-4 text-gray-500">
                ไม่พบข้อมูล
              </div>
            )
          ) : (
            filtered.map((opt) => (
              <ComboboxOption
                key={opt}
                value={opt}
                className="relative cursor-pointer select-none py-2 pl-10 pr-4 text-gray-700 data-[focus]:bg-orange-50 data-[focus]:text-[#F26522]"
              >
                <span
                  className={`block truncate ${selected === opt ? "font-semibold" : "font-normal"}`}
                >
                  {opt}
                </span>
                {selected === opt && (
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#F26522]">
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

// ─── SimpleListbox ────────────────────────────────────────────────────────────

function SimpleListbox({
  name,
  options,
  defaultValue,
  disabled,
  placeholder,
}: {
  name: string;
  options: string[];
  defaultValue?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [selected, setSelected] = useState(defaultValue || "");

  return (
    <Listbox value={selected} onChange={setSelected} disabled={disabled}>
      <div className="relative">
        <input type="hidden" name={name} value={selected} />
        <ListboxButton className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-left outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] data-[open]:border-[#F26522] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed">
          <span className={selected ? "text-gray-700" : "text-gray-400"}>
            {selected || placeholder}
          </span>
          <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
        </ListboxButton>
        <ListboxOptions className="absolute z-10 mt-1 w-full rounded-md border border-gray-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
          {options.map((opt) => (
            <ListboxOption
              key={opt}
              value={opt}
              className="flex items-center justify-between px-3 py-2 cursor-pointer select-none text-gray-700 data-[focus]:bg-orange-50 data-[focus]:text-[#F26522]"
            >
              <span>{opt}</span>
              {selected === opt && <Check className="h-4 w-4 text-[#F26522]" />}
            </ListboxOption>
          ))}
        </ListboxOptions>
      </div>
    </Listbox>
  );
}

// ─── DatePickerField ─────────────────────────────────────────────────────────

function DatePickerField({
  name,
  defaultValue,
  disabled,
  placeholder = "เลือกวันที่",
}: {
  name: string;
  defaultValue?: Date | null;
  disabled?: boolean;
  placeholder?: string;
}) {
  const [date, setDate] = useState<Date | undefined>(
    defaultValue ? new Date(defaultValue) : undefined
  );

  return (
    <>
      <input
        type="hidden"
        name={name}
        value={date ? date.toISOString().split("T")[0] : ""}
      />
      {disabled ? (
        <div className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed">
          <span>
            {date
              ? date.toLocaleDateString("th-TH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })
              : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 text-gray-400" />
        </div>
      ) : (
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] text-left"
            >
              <span className={date ? "text-gray-700" : "text-gray-400"}>
                {date
                  ? date.toLocaleDateString("th-TH", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : placeholder}
              </span>
              <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              captionLayout="dropdown"
              startMonth={new Date(2020, 0)}
              endMonth={new Date(new Date().getFullYear() + 2, 11)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}

// ─── InternshipForm ───────────────────────────────────────────────────────────

const PREFIX_OPTIONS = ["นาย", "นาง", "นางสาว"];
const GENDER_OPTIONS = ["ชาย", "หญิง", "อื่นๆ"];

const POSITION_OPTIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Mobile Developer (iOS/Android)",
  "Software Tester / QA Engineer",
  "Data Scientist / Data Analyst",
  "DevOps / System Engineer",
  "UX/UI Designer",
  "อื่นๆ (โปรดระบุ)",
];

const DEPARTMENT_OPTIONS = [
  "แผนกเทคโนโลยีสารสนเทศ (IT)",
  "ฝ่ายพัฒนาซอฟต์แวร์ (Software Development)",
  "หน่วยงานดิจิทัลและนวัตกรรม",
  "ฝ่ายประกันคุณภาพซอฟต์แวร์ (QA/Tester)",
  "ทีมออกแบบและประสบการณ์ผู้ใช้ (UX/UI)",
  "แผนกวิจัยและพัฒนา (R&D)",
];

const GUARDIAN_RELATIONSHIP_OPTIONS = ["บิดา", "มารดา", "พี่น้อง", "อื่นๆ"];

export default function InternshipForm({
  initialProfile,
  initialInternship,
  email,
}: InternshipFormProps) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [profilePicFile, setProfilePicFile] = useState<File | null>(null);
  const [profilePicPreview, setProfilePicPreview] = useState<string | null>(
    initialProfile?.profilePictureUrl ?? null
  );
  const [existingFiles, setExistingFiles] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/student/dashboard")
      .then(res => res.json())
      .then(data => {
        if (data?.profile?.files) {
          const uniqueFiles = Array.from(
            new Map(data.profile.files.map((f: any) => [f.id || f.fileName, f])).values()
          );
          setExistingFiles(uniqueFiles as any[]);
        }
      })
      .catch(console.error);
  }, []);

  const status = initialInternship?.status;
  const isLocked = status === "PENDING" || status === "COMPLETED" || status === "EDIT_REQUESTED";
  const isRejected = status === "REJECTED";
  const isEditingApproved = status === "EDIT_REQUESTED";

  // Helper to parse JSON feedback for display
  const getFeedbackList = () => {
    if (!initialInternship?.remarks) return null;
    try {
      const parsed = JSON.parse(initialInternship.remarks);
      if (Array.isArray(parsed)) {
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
        return parsed.map((item: any) => ({
          label: fieldMap[item.field] || item.field,
          reason: item.reason
        }));
      }
    } catch (e) {
      return [{ label: null, reason: initialInternship.remarks }];
    }
    return null;
  };
  const feedbackList = getFeedbackList();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(e.type === "dragenter" || e.type === "dragover");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFiles = (newFiles: File[]) => {
    const valid = newFiles.filter((f) => f.size <= 5 * 1024 * 1024);
    setSelectedFiles((prev) => {
      const combined = [...prev, ...valid];
      if (existingFiles.length + combined.length > 5) {
        toast.error("อัปโหลดได้สูงสุด 5 ไฟล์");
        const allowedNewCount = 5 - existingFiles.length - prev.length;
        return allowedNewCount > 0 ? [...prev, ...valid.slice(0, allowedNewCount)] : prev;
      }
      return combined;
    });
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePicFile(file);
      setProfilePicPreview(URL.createObjectURL(file));
    }
  };

  const formAction = async (formData: FormData) => {
    if (isLocked) return;
    // Client-side validation — Step 1: ข้อมูลส่วนตัว
    const prefixVal = formData.get("prefix") as string;
    const firstNameThVal = formData.get("firstNameTh") as string;
    const lastNameThVal = formData.get("lastNameTh") as string;
    const phoneNumberVal = formData.get("phoneNumber") as string;
    const emergencyPhoneVal = formData.get("emergencyPhone") as string;
    const contactAddressVal = formData.get("contactAddress") as string;
    const guardianNameVal = formData.get("guardianName") as string;
    const guardianRelationshipVal = formData.get("guardianRelationship") as string;
    // Client-side validation — Step 2: ข้อมูลการศึกษา
    const educationLevelVal = formData.get("educationLevel") as string;
    const institutionVal = formData.get("institution") as string;
    const facultyVal = formData.get("faculty") as string;
    const majorVal = formData.get("major") as string;
    const advisorNameVal = formData.get("advisorName") as string;
    const advisorPhoneVal = formData.get("advisorPhone") as string;
    // Client-side validation — Step 3: ข้อมูลสถานประกอบการ
    const positionVal = formData.get("position") as string;
    const startDateVal = formData.get("startDate") as string;
    const endDateVal = formData.get("endDate") as string;
    const departmentVal = formData.get("department") as string;
    const supervisorNameVal = formData.get("supervisorName") as string;
    if (
      !prefixVal || !firstNameThVal || !lastNameThVal ||
      !phoneNumberVal || !emergencyPhoneVal || !contactAddressVal ||
      !guardianNameVal || !guardianRelationshipVal ||
      !educationLevelVal || !institutionVal || !facultyVal || !majorVal ||
      !advisorNameVal || !advisorPhoneVal || !positionVal ||
      !startDateVal || !endDateVal || !departmentVal || !supervisorNameVal
    ) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setIsPending(true);
    setMessage(null);

    selectedFiles.forEach((f) => formData.append("attachments", f));
    if (profilePicFile) formData.append("profilePicture", profilePicFile);
    existingFiles.forEach((f) => {
      if (f.id) formData.append("keptFiles", f.id);
    });

    const result = await submitInternshipApplication(null, formData);
    if (result?.success) {
      toast.success("บันทึกข้อมูลสำเร็จ");
      setTimeout(() => window.location.href = "/intern/student", 1000);
    } else if (result?.success === false) {
      let errorDetail = result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล";
      if (result.fields) {
        const errs = Object.values(result.fields).flat();
        if (errs.length > 0) errorDetail = `ข้อมูลไม่ถูกต้อง: ${errs.join(", ")}`;
      }
      setMessage({ type: "error", text: errorDetail });
      setIsPending(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const formatDate = (d?: Date | null) =>
    d
      ? new Date(d).toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "—";

  const statusLabel = status
    ? {
        PENDING: "รอดำเนินการ",
        APPROVED: "อนุมัติแล้ว",
        REJECTED: "ถูกตีกลับให้แก้ไข",
        EDIT_REQUESTED: "รอตรวจสอบการแก้ไข",
        COMPLETED: "จบการฝึกงาน",
      }[status] ?? status
    : "ยังไม่ได้ส่ง";

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 w-full animate-fade-up">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            ฟอร์มนักศึกษาฝึกงาน
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            กรอกรายละเอียดการฝึกงานให้ครบถ้วนเพื่อส่งคำร้องขอฝึกงาน
          </p>
        </div>

        {/* Lock banner */}
        {isLocked && !isEditingApproved && (
          <div className="bg-orange-50 border border-orange-200 text-orange-800 px-4 py-4 rounded-xl flex items-center gap-3">
            <Lock className="w-5 h-5 text-orange-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">ข้อมูลถูกล็อคแล้ว</p>
              <p className="text-sm">
                คุณได้ทำการส่งฟอร์มข้อมูลการฝึกงานไปแล้ว ไม่สามารถแก้ไขข้อมูลได้
              </p>
            </div>
          </div>
        )}

        {/* Rejected (Sent back) banner */}
        {isRejected && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-4 rounded-xl flex items-start gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm">ข้อมูลถูกตีกลับให้แก้ไข</p>
              <div className="text-sm space-y-1">
                <p>กรุณาแก้ไขข้อมูลตามที่เจ้าหน้าที่ระบุและส่งคำร้องใหม่อีกครั้ง:</p>
                {feedbackList ? (
                  <div className="mt-2 pl-2 border-l-2 border-red-200 space-y-1">
                    {feedbackList.map((item, idx) => (
                      <p key={idx} className="font-medium">
                        • {item.label} : <span className="font-normal">{item.reason}</span>
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 font-medium">{initialInternship?.remarks}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Edit Requested banner */}
        {isEditingApproved && (
          <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-4 rounded-xl flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600 shrink-0" />
            <div>
              <p className="font-bold text-sm">กำลังรอตรวจสอบการแก้ไข</p>
              <p className="text-sm">
                คุณได้แก้ไขข้อมูลหลังจากได้รับการอนุมัติแล้ว ขณะนี้กำลังรอเจ้าหน้าที่ตรวจสอบความถูกต้องอีกครั้ง
              </p>
            </div>
          </div>
        )}

        {errorParam === "incomplete" && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-700 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="font-bold">
              กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนเพื่อดำเนินการต่อ
            </span>
          </div>
        )}

        {message && (
          <div
            className={`p-4 rounded-md text-sm font-medium ${
              message.type === "error"
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {message.text}
          </div>
        )}

        <form
          action={formAction}
          className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6"
        >
          {/* ── Photo Upload ── */}
          <div className="flex flex-col items-center gap-3">
            <label
              htmlFor="profilePictureInput"
              className={`w-32 h-40 md:w-40 md:h-52 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden relative transition-colors ${
                isLocked
                  ? "border-gray-200 cursor-not-allowed"
                  : "border-[#F26522]/40 hover:border-[#F26522] hover:bg-orange-50 cursor-pointer"
              }`}
            >
              {profilePicPreview ? (
                <img
                  src={profilePicPreview}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400 px-4 text-center">
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span className="text-xs font-semibold">อัปโหลดรูปโปรไฟล์</span>
                </div>
              )}
              {!isLocked && (
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfilePicChange}
                />
              )}
            </label>
            <p className="text-sm text-[#F26522] font-medium text-center">
              รูปถ่ายในชุดเครื่องแบบนักศึกษาที่ถ่ายไว้ระยะเวลาไม่เกิน 3 ถึง 6 เดือน*
            </p>
          </div>

          {/* ── Section: ข้อมูลส่วนตัว ── */}
          <SectionDivider
            step={1}
            total={3}
            title="ข้อมูลส่วนตัว"
            subtitle="ชื่อ-นามสกุล เบอร์โทรศัพท์ และข้อมูลผู้ปกครอง"
          />

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            {/* prefix | firstName | lastName */}
            <div className="md:col-span-2 flex flex-col md:flex-row gap-x-4 gap-y-5">
              <div className="md:w-1/5 flex flex-col gap-2">
                <FieldLabel required>คำนำหน้าชื่อ</FieldLabel>
                <SimpleListbox
                  name="prefix"
                  options={PREFIX_OPTIONS}
                  defaultValue={initialProfile?.prefix || ""}
                  disabled={isLocked}
                  placeholder="เลือกคำนำหน้า..."
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <FieldLabel required>ชื่อ (ภาษาไทย)</FieldLabel>
                <input
                  type="text"
                  name="firstNameTh"
                  defaultValue={initialProfile?.firstNameTh || ""}
                  disabled={isLocked}
                  placeholder="กรอกชื่อจริง"
                  className={INPUT_CLS}
                />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <FieldLabel required>นามสกุล (ภาษาไทย)</FieldLabel>
                <input
                  type="text"
                  name="lastNameTh"
                  defaultValue={initialProfile?.lastNameTh || ""}
                  disabled={isLocked}
                  placeholder="กรอกนามสกุล"
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* phoneNumber | emergencyPhone */}
            <div className="flex flex-col gap-2">
              <FieldLabel required>เบอร์โทรศัพท์</FieldLabel>
              <input
                type="tel"
                name="phoneNumber"
                defaultValue={initialProfile?.phoneNumber || ""}
                disabled={isLocked}
                placeholder="08X-XXX-XXXX"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel required>เบอร์โทรศัพท์ผู้ปกครอง (ฉุกเฉิน)</FieldLabel>
              <input
                type="tel"
                name="emergencyPhone"
                defaultValue={initialProfile?.emergencyPhone || ""}
                disabled={isLocked}
                placeholder="08X-XXX-XXXX"
                className={INPUT_CLS}
              />
            </div>

            {/* contactAddress */}
            <div className="md:col-span-2 flex flex-col gap-2">
              <FieldLabel required>ที่อยู่ที่สามารถติดต่อได้</FieldLabel>
              <textarea
                name="contactAddress"
                defaultValue={initialProfile?.contactAddress || ""}
                disabled={isLocked}
                rows={3}
                placeholder="ระบุเลขที่บ้าน ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด และรหัสไปรษณีย์"
                className="w-full resize-none rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>

            {/* guardianName | guardianRelationship */}
            <div className="flex flex-col gap-2">
              <FieldLabel required>ชื่อ-นามสกุลผู้ปกครอง</FieldLabel>
              <input
                type="text"
                name="guardianName"
                defaultValue={initialProfile?.guardianName || ""}
                disabled={isLocked}
                placeholder="กรอกชื่อ-นามสกุลผู้ปกครอง"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel required>ความสัมพันธ์</FieldLabel>
              <SimpleListbox
                name="guardianRelationship"
                options={GUARDIAN_RELATIONSHIP_OPTIONS}
                defaultValue={initialProfile?.guardianRelationship || ""}
                disabled={isLocked}
                placeholder="เลือกความสัมพันธ์..."
              />
            </div>
          </div>

          {/* ── Section: ข้อมูลการศึกษา ── */}
          <SectionDivider
            step={2}
            total={3}
            title="ข้อมูลการศึกษา"
            subtitle="ระดับการศึกษา สถาบัน และอาจารย์ที่ปรึกษา"
          />

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <FieldLabel required>ระดับการศึกษา</FieldLabel>
              <SimpleListbox
                name="educationLevel"
                options={["ปวช.", "ปวส.", "ปริญญาตรี", "ปริญญาโท", "ปริญญาเอก"]}
                defaultValue={initialProfile?.educationLevel || "ปริญญาตรี"}
                disabled={isLocked}
                placeholder="เลือกระดับการศึกษา..."
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel required>สถาบัน</FieldLabel>
              <input
                type="text"
                name="institution"
                defaultValue={initialProfile?.institution || ""}
                disabled={isLocked}
                required
                placeholder="เช่น มหาวิทยาลัยเชียงใหม่"
                className={INPUT_CLS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel required>คณะ</FieldLabel>
              <input
                type="text"
                name="faculty"
                defaultValue={initialProfile?.faculty || ""}
                disabled={isLocked}
                required
                placeholder="เช่น คณะวิทยาศาสตร์"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel required>สาขา</FieldLabel>
              <input
                type="text"
                name="major"
                defaultValue={initialProfile?.major || ""}
                disabled={isLocked}
                required
                placeholder="เช่น วิทยาการคอมพิวเตอร์"
                className={INPUT_CLS}
              />
            </div>

            <div className="flex flex-col gap-2">
              <FieldLabel required>ชื่อ-นามสกุล อาจารย์ที่ปรึกษาสหกิจ</FieldLabel>
              <input
                type="text"
                name="advisorName"
                defaultValue={initialProfile?.advisorName || ""}
                disabled={isLocked}
                required
                placeholder="เช่น ผศ.ดร. ชื่อ นามสกุล"
                className={INPUT_CLS}
              />
            </div>
            <div className="flex flex-col gap-2">
              <FieldLabel required>เบอร์โทรศัพท์อาจารย์ที่ปรึกษาสหกิจ</FieldLabel>
              <input
                type="tel"
                name="advisorPhone"
                defaultValue={initialProfile?.advisorPhone || ""}
                disabled={isLocked}
                required
                placeholder="08X-XXX-XXXX"
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* ── Section: ข้อมูลสถานประกอบการ ── */}
          <SectionDivider
            step={3}
            total={3}
            title="ข้อมูลสถานประกอบการ"
            subtitle="ตำแหน่งฝึกงาน หน่วยงาน และระยะเวลา"
          />

          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-12">
            {/* ตำแหน่ง | วันเริ่ม | วันสิ้นสุด */}
            <div className="md:col-span-6 flex flex-col gap-2">
              <FieldLabel required>ตำแหน่งที่ฝึกงาน</FieldLabel>
              <SearchableCombobox
                name="position"
                options={POSITION_OPTIONS}
                defaultValue={initialInternship?.position}
                disabled={isLocked}
                placeholder="ค้นหาหรือพิมพ์ตำแหน่ง..."
                freeText
              />
            </div>
            <div className="md:col-span-3 flex flex-col gap-2">
              <FieldLabel required>วันที่เริ่มฝึกงาน</FieldLabel>
              <DatePickerField
                name="startDate"
                defaultValue={initialInternship?.startDate}
                disabled={isLocked}
                placeholder="เลือกวันเริ่ม"
              />
            </div>
            <div className="md:col-span-3 flex flex-col gap-2">
              <FieldLabel required>วันที่สิ้นสุดฝึกงาน</FieldLabel>
              <DatePickerField
                name="endDate"
                defaultValue={initialInternship?.endDate}
                disabled={isLocked}
                placeholder="เลือกวันสิ้นสุด"
              />
            </div>

            {/* หน่วยงาน | ผู้ดูแล */}
            <div className="md:col-span-6 flex flex-col gap-2">
              <FieldLabel required>หน่วยงานที่ไปฝึก</FieldLabel>
              <SearchableCombobox
                name="department"
                options={DEPARTMENT_OPTIONS}
                defaultValue={initialInternship?.department || ""}
                disabled={isLocked}
                placeholder="ค้นหาหรือพิมพ์ชื่อแผนก..."
                freeText
              />
            </div>
            <div className="md:col-span-6 flex flex-col gap-2">
              <FieldLabel required>ชื่อ-นามสกุลผู้ดูแล</FieldLabel>
              <input
                type="text"
                name="supervisorName"
                defaultValue={initialInternship?.supervisorName || ""}
                disabled={isLocked}
                required
                placeholder="เช่น นาย ชื่อ นามสกุล"
                className={INPUT_CLS}
              />
            </div>

            {/* รายละเอียดเพิ่มเติม */}
            <div className="md:col-span-12 flex flex-col gap-2">
              <FieldLabel>รายละเอียดเพิ่มเติม</FieldLabel>
              <textarea
                name="remarks"
                defaultValue={initialInternship?.remarks?.startsWith('[') || initialInternship?.remarks?.startsWith('{') ? "" : initialInternship?.remarks || ""}
                disabled={isLocked}
                rows={5}
                placeholder="ระบุรายละเอียดเพิ่มเติม (ถ้ามี)"
                className="w-full resize-none rounded-md border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
              />
            </div>

            {/* File Upload / Existing Files */}
            <div className="md:col-span-12 flex flex-col gap-3">
              {isLocked ? (
                <>
                  <FieldLabel>เอกสารที่อัปโหลดแล้ว</FieldLabel>
                  {existingFiles.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      {existingFiles.map((f, i) => (
                        <div
                          key={f.id || i}
                          className="flex items-center gap-2 text-sm p-3 bg-gray-50 border border-gray-200 rounded-md cursor-not-allowed"
                        >
                          <FileText className="w-4 h-4 text-[#F26522] shrink-0" />
                          <span className="text-gray-500 truncate font-medium">{f.fileName}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic px-1">ไม่มีเอกสารที่อัปโหลด</div>
                  )}
                </>
              ) : (
                <>
                  <FieldLabel>
                    ไฟล์เอกสาร (PDF/PNG/JPG สูงสุด 5 ไฟล์ ไม่เกิน 5 MB/ไฟล์) — เหลืออัปได้ {Math.max(0, 5 - existingFiles.length - selectedFiles.length)} ไฟล์
                  </FieldLabel>

                  {existingFiles.length > 0 && (
                    <div className="flex flex-col gap-2 mb-1">
                      <p className="text-xs font-bold text-gray-500">ไฟล์ที่อัปโหลดไว้แล้วในระบบ:</p>
                      {existingFiles.map((f, i) => (
                        <div
                          key={f.id || i}
                          className="flex justify-between items-center text-sm p-3 bg-white border border-gray-200 rounded-md shadow-sm"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-[#F26522] shrink-0" />
                            <span className="text-gray-700 truncate font-medium">{f.fileName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExistingFiles(prev => prev.filter(file => file.id !== f.id))}
                            className="text-red-400 hover:text-red-600 font-bold px-2 shrink-0"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedFiles.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {selectedFiles.map((f, i) => (
                        <div
                          key={i}
                          className="flex justify-between items-center text-sm p-3 bg-gray-50 border border-gray-200 rounded-md"
                        >
                          <span className="text-gray-700 truncate">{f.name}</span>
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFiles((prev) => prev.filter((_, idx) => idx !== i))
                            }
                            className="text-red-400 hover:text-red-600 font-bold px-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div
                    className={`w-full h-32 rounded-lg border-2 border-dashed flex items-center justify-center transition-colors cursor-pointer relative ${
                      dragActive
                        ? "border-[#F26522] bg-orange-50"
                        : "border-gray-300 bg-[#F9FAFB] hover:bg-gray-100"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <span className="text-sm text-gray-500 pointer-events-none">
                      Drag & Drop your file or{" "}
                      <span className="underline">Browse</span>
                    </span>
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.png,.jpg,.jpeg"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => handleFiles(Array.from(e.target.files || []))}
                    />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ── Submit ── */}
          {!isLocked && (
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isPending}
                className="px-10 py-2.5 text-sm font-medium text-white rounded-md
                  bg-gradient-to-r from-[#FF9B5C] to-[#F16422]
                  shadow-md hover:shadow-lg hover:brightness-95
                  active:scale-[0.97] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? "กำลังบันทึก..." : "บันทึก"}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
// ─── Small helpers ────────────────────────────────────────────────────────────

const INPUT_CLS =
  "w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522] disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed";

function SectionDivider({
  step,
  total,
  title,
  subtitle,
  action,
}: {
  step: number;
  total: number;
  title: string;
  subtitle: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 pt-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-[#FF9B5C] to-[#F16422] flex items-center justify-center shrink-0">
          <span className="text-white text-sm font-bold">{step}</span>
        </div>
        <div className="w-full flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-gray-900">{title}</span>
              <span className="text-xs text-gray-400 font-medium">ขั้นตอนที่ {step}/{total}</span>
            </div>
            <p className="text-xs text-gray-500">{subtitle}</p>
          </div>
          {action}
        </div>
      </div>
      <div className="h-px bg-gray-200 mt-2" />
    </div>
  );
}

function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode;
  required?: boolean;
  htmlFor?: string;
}) {
  return (
    <label htmlFor={htmlFor} className="text-sm font-medium text-gray-800">
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function ReadonlyField({ value }: { value?: string | null }) {
  return (
    <div className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 cursor-not-allowed truncate">
      {value || "—"}
    </div>
  );
}

function Required() {
  return <span className="text-red-500 ml-0.5">*</span>;
}
