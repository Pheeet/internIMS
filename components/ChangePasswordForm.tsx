"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Check, CheckCircle2, Lock } from "lucide-react";
import { changePasswordAction } from "@/app/actions/change-password";

export default function ChangePasswordForm() {
  const router = useRouter();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const oldValid = oldPwd.length > 0; // แค่เช็คว่าไม่ว่าง

  const checks = useMemo(
    () => [
      { label: "อย่างน้อย 12 ตัวอักษร", ok: newPwd.length >= 12 },
      { label: "ตัวพิมพ์ใหญ่อย่างน้อย 1 ตัว", ok: /[A-Z]/.test(newPwd) },
      { label: "ตัวพิมพ์เล็กอย่างน้อย 1 ตัว", ok: /[a-z]/.test(newPwd) },
      { label: "อักขระพิเศษอย่างน้อย 1 ตัว", ok: /[^A-Za-z0-9]/.test(newPwd) },
      { label: "ตัวเลขอย่างน้อย 1 ตัว", ok: /\d/.test(newPwd) },
    ],
    [newPwd]
  );

  const allValid = checks.every((c) => c.ok);
  const showNewError = newPwd.length > 0 && !allValid;
  const confirmMatch = confirmPwd.length > 0 && confirmPwd === newPwd;
  const canSubmit = oldValid && allValid && confirmMatch && !isPending;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setServerError("");
    const formData = new FormData(e.currentTarget);
    const result = await changePasswordAction(formData);
    setIsPending(false);
    if (result?.success) {
      setSuccess(true);
      const redirectUrl = (result as any).redirectUrl || "/intern/student";
      setTimeout(() => router.push(redirectUrl), 1800);
    } else {
      setServerError(result?.error ?? "เกิดข้อผิดพลาด");
    }
  };

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">เปลี่ยนรหัสผ่าน</h1>
        <p className="mt-1 text-sm text-gray-500">
          กรุณากรอกรหัสผ่านเดิมและตั้งรหัสผ่านใหม่ที่ปลอดภัย
        </p>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {success ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="h-7 w-7 text-green-600" />
            </span>
            <p className="text-base font-semibold text-green-700">เปลี่ยนรหัสผ่านสำเร็จ</p>
            <p className="text-sm text-gray-500">กำลังนำคุณกลับ...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Old password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                รหัสผ่านเดิม
              </label>
              <div className="relative">
                <input
                  name="oldPwd"
                  type={showOld ? "text" : "password"}
                  value={oldPwd}
                  onChange={(e) => setOldPwd(e.target.value)}
                  placeholder="กรอกรหัสผ่านเดิม"
                  className="h-11 w-full rounded-md border border-gray-300 px-3 pr-11 text-sm text-gray-900 outline-none transition-colors focus:border-[#F26522] focus:ring-1 focus:ring-[#F26522]"
                />
                <button
                  type="button"
                  onClick={() => setShowOld((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showOld ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {serverError && (
                <p className="mt-1.5 text-sm font-medium text-red-500">
                  {serverError}
                </p>
              )}
            </div>

            {/* New password */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">รหัสผ่านใหม่</label>
              <div className="relative">
                <input
                  name="newPwd"
                  type={showNew ? "text" : "password"}
                  value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)}
                  placeholder="กรอกรหัสผ่านใหม่"
                  className={`h-11 w-full rounded-md border px-3 pr-11 text-sm text-gray-900 outline-none transition-colors focus:ring-1 ${
                    showNewError
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : allValid && newPwd
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : "border-gray-300 focus:border-[#F26522] focus:ring-[#F26522]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNew((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
              {showNewError && (
                <p className="mt-2 text-sm font-medium text-red-500">
                  กรุณาเพิ่มอักขระที่จำเป็นเพื่อสร้างรหัสผ่านที่ปลอดภัย
                </p>
              )}
              <ul className="mt-3 space-y-1.5">
                {checks.map((c) => {
                  const failing = newPwd.length > 0 && !c.ok;
                  return (
                    <li key={c.label} className="flex items-center gap-2 text-sm">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          c.ok ? "bg-green-500" : failing ? "bg-red-500" : "bg-gray-300"
                        }`}
                      />
                      <span
                        className={
                          c.ok
                            ? "font-medium text-green-600"
                            : failing
                            ? "font-medium text-red-500"
                            : "text-gray-400"
                        }
                      >
                        {c.label}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Confirm password */}
            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700">ยืนยันรหัสผ่านใหม่</label>
                {confirmMatch && (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <CheckCircle2 className="h-4 w-4" /> ตรงกัน
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  name="confirmPwd"
                  type={showConfirm ? "text" : "password"}
                  value={confirmPwd}
                  onChange={(e) => setConfirmPwd(e.target.value)}
                  placeholder="กรอกยืนยันรหัสผ่านใหม่"
                  className={`h-11 w-full rounded-md border px-3 pr-11 text-sm text-gray-900 outline-none transition-colors focus:ring-1 ${
                    confirmPwd && !confirmMatch
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : confirmMatch
                      ? "border-green-500 focus:border-green-500 focus:ring-green-500"
                      : "border-gray-300 focus:border-[#F26522] focus:ring-[#F26522]"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-gradient-to-r from-[#FF9B5C] to-[#F16422] text-sm font-semibold text-white shadow-md transition-all hover:brightness-95 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Lock className="h-4 w-4" />
              {isPending ? "กำลังเปลี่ยนรหัสผ่าน..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
