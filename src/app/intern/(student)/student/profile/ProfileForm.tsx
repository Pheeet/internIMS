"use client";

import { useState } from "react";
import Link from "next/link";
import { saveProfileInfo } from "@/app/actions/profile";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, ChevronDown, Check, CalendarIcon, Lock } from "lucide-react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from "@headlessui/react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const PREFIX_OPTIONS = ["นาย", "นาง", "นางสาว"];
const GENDER_OPTIONS = ["ชาย", "หญิง", "อื่นๆ"];
const GUARDIAN_RELATIONSHIP_OPTIONS = ["บิดา", "มารดา", "พี่น้อง", "อื่นๆ"];

interface ProfileFormProps {
  initialData?: {
    prefix?: string;
    firstNameTh?: string;
    lastNameTh?: string;
    gender?: string | null;
    dob?: Date | null;
    phoneNumber?: string | null;
    emergencyPhone?: string | null;
    contactAddress?: string | null;
    guardianName?: string | null;
    guardianRelationship?: string | null;
    profilePictureUrl?: string | null;
  } | null;
  email?: string | null;
  isLocked?: boolean;
}

export default function ProfileForm({ initialData, email, isLocked = false }: ProfileFormProps) {
  const [profileImage, setProfileImage] = useState<string | null>(
    initialData?.profilePictureUrl || null
  );
  const [prefix, setPrefix] = useState<string>(initialData?.prefix || "");
  const [gender, setGender] = useState<string>(initialData?.gender || "");
  const [guardianRelationship, setGuardianRelationship] = useState<string>(initialData?.guardianRelationship || "");
  const [dob, setDob] = useState<Date | undefined>(
    initialData?.dob ? new Date(initialData.dob) : undefined
  );
  const [isPending, setIsPending] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("ไฟล์ใหญ่เกินไป", { description: "กรุณาเลือกรูปที่มีขนาดไม่เกิน 5MB" });
        event.target.value = "";
        return;
      }
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleReset = () => {
    setProfileImage(initialData?.profilePictureUrl || null);
    setDob(initialData?.dob ? new Date(initialData.dob) : undefined);
    setPrefix(initialData?.prefix || "");
    setGender(initialData?.gender || "");
    setGuardianRelationship(initialData?.guardianRelationship || "");
    setFieldErrors({});
  };

  const formAction = async (formData: FormData) => {
    // Client-side validation
    const firstNameThVal = formData.get("firstNameTh") as string;
    const lastNameThVal = formData.get("lastNameTh") as string;
    const phoneNumberVal = formData.get("phoneNumber") as string;
    const emergencyPhoneVal = formData.get("emergencyPhone") as string;
    const contactAddressVal = formData.get("contactAddress") as string;
    const guardianNameVal = formData.get("guardianName") as string;
    
    if (
      !prefix || !firstNameThVal || !lastNameThVal || !gender || !dob ||
      !phoneNumberVal || !emergencyPhoneVal || !contactAddressVal ||
      !guardianNameVal || !guardianRelationship
    ) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }

    setIsPending(true);
    setFieldErrors({});

    try {
      const result = await saveProfileInfo(null, formData);
      if (result?.success) {
        toast.success("บันทึกข้อมูลสำเร็จ");
        if (result.redirectUrl) {
          window.location.href = result.redirectUrl;
        } else {
          setIsPending(false);
          router.refresh();
        }
      } else {
        if (result?.fields) {
          setFieldErrors(result.fields);
          // Show each field error as a toast
          Object.values(result.fields).flat().forEach((msg) => {
            toast.error(msg);
          });
        } else {
          toast.error(result?.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
        setIsPending(false);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      console.error("Profile form submission error:", err);
      toast.error("เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง");
      setIsPending(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    void formAction(formData);
  };

  return (
    <div className="mx-auto max-w-5xl py-8 px-4 w-full h-full animate-fade-up">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="mb-2">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">
            ข้อมูลส่วนตัวนักศึกษา
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            กรุณากรอกข้อมูลส่วนตัวให้ครบถ้วนและถูกต้องเพื่อใช้ในการสมัครฝึกงาน
          </p>
        </div>

        {isLocked && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3 text-blue-700 shadow-sm">
            <Lock className="w-6 h-6 shrink-0" />
            <span className="font-bold">
              ข้อมูลส่วนตัวของคุณถูกล็อคแล้ว เนื่องจากคุณจบการฝึกงานเรียบร้อยแล้ว
            </span>
          </div>
        )}

        {error === "incomplete" && (
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3 text-orange-700 shadow-sm">
            <AlertCircle className="w-6 h-6 shrink-0" />
            <span className="font-bold">
              กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วนเพื่อดำเนินการต่อ
            </span>
          </div>
        )}

        {/* Main Card */}
        <form
          onSubmit={handleSubmit}
          onReset={handleReset}
          noValidate
          className={`bg-white rounded-xl shadow-lg p-8 flex flex-col gap-6 ${isLocked ? "pointer-events-none opacity-90 select-none" : ""}`}
        >
          {/* Top Section: Photo and Initial Fields */}
          <div className="flex flex-col md:flex-row gap-10">
            {/* Left Column - Photo Upload */}
            <div className="md:w-1/3 flex flex-col items-center">
              <div className="w-full max-w-xs">
                <label
                  htmlFor="profilePhoto"
                  className={`flex flex-col items-center justify-center w-full h-[280px] rounded-xl border-2 border-dashed border-gray-300 bg-[#F9FAFB] ${isLocked ? "cursor-not-allowed" : "cursor-pointer hover:bg-gray-100"} transition-colors relative overflow-hidden`}
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt="Profile"
                      className="w-full h-full object-contain rounded-lg p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-center px-8">
                      <svg
                        className="w-12 h-12 text-[#9CA3AF] mb-4"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path
                          d="M4 7h4l2-3h4l2 3h4v13H4V7zm6 3l-1.5 5h7L14 10h-4z"
                          opacity="0.3"
                        />
                        <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zM9.88 5h4.24l1.83 2H20v12H4V7h4.05l1.83-2zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3z" />
                        <circle cx="15.5" cy="8.5" r="1.5" />
                      </svg>
                      <span className="text-sm text-[#6B7280] leading-relaxed">
                        รูปถ่ายในชุดนักศึกษาที่ถ่ายไว้
                        <br />
                        ระยะเวลาไม่เกิน 3 ถึง 6 เดือน
                      </span>
                    </div>
                  )}
                  <input
                    id="profilePhoto"
                    name="profilePhoto"
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    className="hidden"
                    disabled={isLocked}
                    onChange={handleImageUpload}
                  />
                </label>
                <p className="text-xs text-[#9CA3AF] mt-3 text-center">
                  ไฟล์ที่รองรับ: JPG, PNG (สูงสุด 5MB)
                </p>
              </div>
            </div>

            {/* Right Column - Top Form Details */}
            <div className="md:w-2/3 grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-5 content-start">
              {/* Row 1: Prefix, First Name, Last Name */}
              <div className="md:col-span-4 flex flex-col md:flex-row gap-x-6 gap-y-5">
                {/* Prefix */}
                <div className="md:w-1/4">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    คำนำหน้าชื่อ<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <Listbox name="prefix" value={prefix} onChange={setPrefix} disabled={isLocked}>
                    <div className="relative">
                      <ListboxButton className={`w-full flex items-center justify-between rounded-md border bg-white px-3 py-2.5 text-sm text-left outline-none focus:ring-1 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.prefix ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522] data-[open]:border-[#F26522]"}`}>
                        <span className={prefix ? "text-gray-700" : "text-gray-400"}>
                          {prefix || "เลือกคำนำห..."}
                        </span>
                        <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                      </ListboxButton>
                      <ListboxOptions
                        anchor="bottom"
                        className="z-50 w-[var(--button-width)] rounded-md border border-gray-200 bg-white shadow-lg mt-1 py-1 text-sm focus:outline-none"
                      >
                        {PREFIX_OPTIONS.map((opt) => (
                          <ListboxOption
                            key={opt}
                            value={opt}
                            className="flex items-center justify-between px-3 py-2 cursor-pointer select-none text-gray-900 data-[focus]:bg-orange-50 data-[focus]:text-[#F26522]"
                          >
                            <span>{opt}</span>
                            {prefix === opt && (
                              <Check className="h-4 w-4 text-[#F26522]" />
                            )}
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </div>

                {/* First Name */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-800 mb-2 whitespace-nowrap">
                    ชื่อ (ภาษาไทย)<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    name="firstNameTh"
                    defaultValue={initialData?.firstNameTh || ""}
                    placeholder="กรอกชื่อจริง"
                    className={`w-full rounded-md border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.firstNameTh ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522]"}`}
                    disabled={isLocked}
                  />
                </div>

                {/* Last Name */}
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-800 mb-2">
                    นามสกุล (ภาษาไทย)<span className="text-red-500 ml-0.5">*</span>
                  </label>
                  <input
                    type="text"
                    name="lastNameTh"
                    defaultValue={initialData?.lastNameTh || ""}
                    placeholder="กรอกนามสกุล"
                    className={`w-full rounded-md border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.lastNameTh ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522]"}`}
                    disabled={isLocked}
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  เพศ<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Listbox name="gender" value={gender} onChange={setGender} disabled={isLocked}>
                  <div className="relative">
                    <ListboxButton className={`w-full flex items-center justify-between rounded-md border bg-white px-4 py-2.5 text-sm text-left outline-none focus:ring-1 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.gender ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522] data-[open]:border-[#F26522]"}`}>
                      <span className={gender ? "text-gray-700" : "text-gray-400"}>
                        {gender || "เลือกเพศ"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                    </ListboxButton>
                    <ListboxOptions
                      anchor="bottom"
                      className="z-50 w-[var(--button-width)] rounded-md border border-gray-200 bg-white shadow-lg mt-1 py-1 text-sm focus:outline-none"
                    >
                      {GENDER_OPTIONS.map((opt) => (
                        <ListboxOption
                          key={opt}
                          value={opt}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer select-none text-gray-700 data-[focus]:bg-orange-50 data-[focus]:text-[#F26522]"
                        >
                          <span>{opt}</span>
                          {gender === opt && (
                            <Check className="h-4 w-4 text-[#F26522]" />
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>

              {/* DOB */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  วันเกิด<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={`w-full flex items-center justify-between rounded-md border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 text-left disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.dob ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522]"}`}
                      disabled={isLocked}
                    >
                      <span className={dob ? "text-gray-700" : "text-gray-400"}>
                        {dob
                          ? dob.toLocaleDateString("th-TH", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "เลือกวันเกิด"}
                      </span>
                      <CalendarIcon className="h-4 w-4 text-gray-400 shrink-0" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={dob}
                      onSelect={setDob}
                      captionLayout="dropdown" // เปลี่ยนหัวปฏิทินเป็น Dropdown
                      startMonth={new Date(1990, 0)} // ปีเริ่มต้น
                      endMonth={new Date(new Date().getFullYear(), 11)} // ปีปัจจุบัน
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                {/* hidden input for form submission */}
                <input
                  type="hidden"
                  name="dob"
                  value={dob ? dob.toISOString().split("T")[0] : ""}
                />
              </div>

              {/* Email */}
              <div className="md:col-span-4">
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  อีเมลมหาวิทยาลัย
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={email || ""}
                    readOnly
                    className="w-full rounded-md border border-gray-200 bg-[#F9FAFB] px-4 py-2.5 text-sm text-gray-500 outline-none cursor-not-allowed"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center px-4">
                    <svg
                      className="h-5 w-5 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-green-600">
                  <svg
                    className="h-3.5 w-3.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  ยืนยันผ่าน @cmu.ac.th แล้ว
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Section: Full-Width Fields */}
          <div className="flex flex-col gap-y-5 w-full mt-2">
            {/* Phone + Emergency Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  เบอร์โทรศัพท์<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  defaultValue={initialData?.phoneNumber || ""}
                  placeholder="08X-XXX-XXXX"
                  maxLength={10}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                  }}
                  className={`w-full rounded-md border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.phoneNumber ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522]"}`}
                  disabled={isLocked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  เบอร์โทรศัพท์ผู้ปกครอง (ฉุกเฉิน)<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="tel"
                  name="emergencyPhone"
                  defaultValue={initialData?.emergencyPhone || ""}
                  placeholder="08X-XXX-XXXX"
                  maxLength={10}
                  onInput={(e) => {
                    e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, "");
                  }}
                  className={`w-full rounded-md border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.emergencyPhone ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522]"}`}
                  disabled={isLocked}
                />
              </div>
            </div>

            {/* Address */}
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-800 mb-2">
                ที่อยู่ที่สามารถติดต่อได้<span className="text-red-500 ml-0.5">*</span>
              </label>
              <textarea
                name="contactAddress"
                defaultValue={initialData?.contactAddress || ""}
                rows={3}
                placeholder="ระบุเลขที่บ้าน ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด และรหัสไปรษณีย์"
                className={`w-full resize-none rounded-md border bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:ring-1 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.contactAddress ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522]"}`}
                disabled={isLocked}
              />
            </div>

            {/* Guardian Name + Relationship */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  ชื่อ-นามสกุลผู้ปกครอง<span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                  type="text"
                  name="guardianName"
                  defaultValue={initialData?.guardianName || ""}
                  placeholder="กรอกชื่อ-นามสกุลผู้ปกครอง"
                  className={`w-full rounded-md border bg-white px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-1 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.guardianName ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522]"}`}
                  disabled={isLocked}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 mb-2">
                  ความสัมพันธ์<span className="text-red-500 ml-0.5">*</span>
                </label>
                <Listbox name="guardianRelationship" value={guardianRelationship} onChange={setGuardianRelationship} disabled={isLocked}>
                  <div className="relative">
                    <ListboxButton className={`w-full flex items-center justify-between rounded-md border bg-white px-4 py-2.5 text-sm text-left outline-none focus:ring-1 disabled:bg-gray-50 disabled:cursor-not-allowed ${fieldErrors.guardianRelationship ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-gray-200 focus:border-[#F26522] focus:ring-[#F26522] data-[open]:border-[#F26522]"}`}>
                      <span className={guardianRelationship ? "text-gray-700" : "text-gray-400"}>
                        {guardianRelationship || "เลือกความสัมพันธ์"}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                    </ListboxButton>
                    <ListboxOptions
                      anchor="bottom"
                      className="z-50 w-[var(--button-width)] rounded-md border border-gray-200 bg-white shadow-lg mt-1 py-1 text-sm focus:outline-none"
                    >
                      {GUARDIAN_RELATIONSHIP_OPTIONS.map((opt) => (
                        <ListboxOption
                          key={opt}
                          value={opt}
                          className="flex items-center justify-between px-3 py-2 cursor-pointer select-none text-gray-700 data-[focus]:bg-orange-50 data-[focus]:text-[#F26522]"
                        >
                          <span>{opt}</span>
                          {guardianRelationship === opt && (
                            <Check className="h-4 w-4 text-[#F26522]" />
                          )}
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </div>
            </div>

            {!isLocked && (
              <div className="flex justify-end items-center gap-4 mt-2 w-full">
                <div className="flex items-center gap-4">
                <button
                  type="reset"
                  disabled={isPending}
                  className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  ยกเลิกการแก้ไข
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-8 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-[#FF9B5C] to-[#F16422] rounded-md shadow-md hover:shadow-lg hover:brightness-95 active:scale-[0.97] transition-all duration-150 disabled:opacity-70"
                >
                  {isPending ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
                </div>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
