"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Shield, UserPlus, Search, Crown, GraduationCap, Copy, Loader2, KeyRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

type Admin = {
  id: string;
  name: string;
  initials: string;
  email: string;
  addedAt: string;
};

type Student = {
  id: string;
  name: string;
  initials: string;
  email: string;
  password: string;
  addedAt: string;
};

const thaiFirstNames = ["สมชาย", "สมหญิง", "ปรียา", "วิชัย", "นภา", "ธนกร", "ศิริพร", "อนุชา", "พิมพ์ใจ", "กิตติ", "ชลธิชา", "ณัฐวุฒิ", "พรทิพย์", "รัตนา", "สุดารัตน์"];
const thaiLastNames = ["ใจดี", "วงษ์สุวรรณ", "ประมวลผล", "ศรีสุข", "แก้วมณี", "ทองคำ", "บุญมี", "พันธุ์ทอง", "สายใจ", "รุ่งเรือง", "พิทักษ์", "อินทร์ทอง"];

const generateRandomThaiName = () => {
  const f = thaiFirstNames[Math.floor(Math.random() * thaiFirstNames.length)];
  const l = thaiLastNames[Math.floor(Math.random() * thaiLastNames.length)];
  return `${f} ${l}`;
};

const generateSecurePassword = (length = 14) => {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const nums = "23456789";
  const sym = "!@#$%^&*-_=+";
  const all = upper + lower + nums + sym;
  const pick = (set: string) => set[Math.floor(Math.random() * set.length)];
  let pwd = pick(upper) + pick(lower) + pick(nums) + pick(sym);
  for (let i = pwd.length; i < length; i++) pwd += pick(all);
  return pwd.split("").sort(() => Math.random() - 0.5).join("");
};

export default function AdminManagementClient({ currentUserEmail, userRole = "ADMIN" }: { currentUserEmail?: string; userRole?: string }) {
  const isSuperAdmin = userRole === "SUPER_ADMIN";
  
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(!isSuperAdmin); // Don't load if not SUPER_ADMIN
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admin/management/admins");
      if (!res.ok) throw new Error("Failed to fetch admins");
      const data = await res.json();
      const mapped: Admin[] = data.map((d: any) => {
        const name = d.firstNameTh && d.lastNameTh ? `${d.firstNameTh} ${d.lastNameTh}` : d.email.split("@")[0];
        let initials = "";
        if (d.firstNameTh && d.lastNameTh) {
          initials = `${d.firstNameTh[0]}${d.lastNameTh[0]}`;
        } else {
          initials = name.slice(0, 2).toUpperCase();
        }
        const addedAt = new Date(d.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
        return { id: d.id, name, initials, email: d.email, addedAt };
      });
      setAdmins(mapped);
    } catch (err) {
      toast.error("ดึงข้อมูล Admin ไม่สำเร็จ");
    } finally {
      setIsLoadingAdmins(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/admin/management/students");
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      const mapped: Student[] = data.map((d: any) => {
        const name = d.firstNameTh && d.lastNameTh ? `${d.firstNameTh} ${d.lastNameTh}` : d.email.split("@")[0];
        let initials = "";
        if (d.firstNameTh && d.lastNameTh) {
          initials = `${d.firstNameTh[0]}${d.lastNameTh[0]}`;
        } else {
          initials = name.slice(0, 2).toUpperCase();
        }
        const addedAt = new Date(d.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
        return { id: d.id, name, initials, email: d.email, password: "", addedAt };
      });
      setStudents(mapped);
    } catch (err) {
      toast.error("ดึงข้อมูล Student ไม่สำเร็จ");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAdmins();
    }
    fetchStudents();
  }, [isSuperAdmin]);

  const [searchQuery, setSearchQuery] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [activeTab, setActiveTab] = useState(isSuperAdmin ? "admin" : "student");
  const [showRevokeModal, setShowRevokeModal] = useState(false);
  const [targetAdmin, setTargetAdmin] = useState<{ id: string; name: string; email: string } | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [targetStudent, setTargetStudent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [removeConfirmEmail, setRemoveConfirmEmail] = useState("");
  const [removeEmailError, setRemoveEmailError] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetTargetStudent, setResetTargetStudent] = useState<{ id: string; name: string; email: string } | null>(null);
  const [resetConfirmEmail, setResetConfirmEmail] = useState("");
  const [resetEmailError, setResetEmailError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const filteredAdmins = admins.filter(
    (a) => a.name.includes(searchQuery) || a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredStudents = students.filter(
    (s) => s.name.includes(searchQuery) || s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const revokeAdmin = async (email: string) => {
    const admin = admins.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) {
      toast.error("ไม่พบผู้ดูแลในระบบ");
      return;
    }

    try {
      const res = await fetch(`/api/admin/management/admins/${admin.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to revoke");
      setAdmins((prev) => prev.filter((a) => a.id !== admin.id));
      toast.success("ลบผู้ดูแลสำเร็จ", { description: "ผู้ใช้ถูกถอดสิทธิ์ Admin แล้ว" });
    } catch (err) {
      toast.error("ลบผู้ดูแลไม่สำเร็จ");
    }
  };

  const resetRevokeModalState = () => {
    setShowRevokeModal(false);
    setTargetAdmin(null);
    setConfirmEmail("");
    setEmailError("");
  };

  const openRevokeModal = (admin: Admin) => {
    if (currentUserEmail && admin.email.toLowerCase() === currentUserEmail.toLowerCase()) {
      return;
    }
    setTargetAdmin({ id: admin.id, name: admin.name, email: admin.email });
    setConfirmEmail("");
    setEmailError("");
    setShowRevokeModal(true);
  };

  const handleConfirmRevoke = async () => {
    if (!targetAdmin) return;
    if (confirmEmail.trim().toLowerCase() !== targetAdmin.email.toLowerCase()) {
      setEmailError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    await revokeAdmin(targetAdmin.email);
    resetRevokeModalState();
  };

  const handleAddAdmin = async () => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("อีเมลไม่ถูกต้อง", { description: "กรุณากรอกอีเมลให้ถูกต้อง" });
      return;
    }
    if (admins.some((a) => a.email.toLowerCase() === email)) {
      toast.error("มีอีเมลนี้แล้ว", { description: email });
      return;
    }
    
    try {
      const res = await fetch("/api/admin/management/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add admin");
      }
      toast.success("เพิ่ม Admin สำเร็จ");
      setNewAdminEmail("");
      fetchAdmins();
    } catch (err: any) {
      toast.error("เพิ่ม Admin ไม่สำเร็จ", { description: err.message });
    }
  };

  const handleAddStudent = async () => {
    const email = studentEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("อีเมลไม่ถูกต้อง", { description: "กรุณากรอกอีเมลให้ถูกต้อง" });
      return;
    }
    if (students.some((s) => s.email === email)) {
      toast.error("มีอีเมลนี้แล้ว", { description: email });
      return;
    }
    
    const password = generateSecurePassword();
    const name = generateRandomThaiName();
    const [firstNameTh, lastNameTh] = name.split(" ");
    
    try {
      const res = await fetch("/api/admin/management/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, prefix: "นาย", firstNameTh, lastNameTh })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add student");
      }
      
      const data = await res.json();
      const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2);
      const addedAt = new Date(data.user.createdAt).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
      
      setStudents((prev) => [{ id: data.user.id, name, initials, email, password, addedAt }, ...prev]);
      setStudentEmail("");
      toast.success("เพิ่ม Student สำเร็จ", { description: "สร้างรหัสผ่านปลอดภัยให้แล้ว" });
    } catch (err: any) {
      toast.error("เพิ่ม Student ไม่สำเร็จ", { description: err.message });
    }
  };

  const removeStudent = async (email: string) => {
    const student = students.find((s) => s.email.toLowerCase() === email.toLowerCase());
    if (!student) {
      toast.error("ไม่พบนักศึกษาในระบบ");
      return;
    }

    try {
      const res = await fetch(`/api/admin/management/students/${student.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove student");
      setStudents((prev) => prev.filter((s) => s.id !== student.id));
      toast.success("ลบนักศึกษาแล้ว");
    } catch (err) {
      toast.error("ลบนักศึกษาไม่สำเร็จ");
    }
  };

  const resetRemoveModalState = () => {
    setShowRemoveModal(false);
    setTargetStudent(null);
    setRemoveConfirmEmail("");
    setRemoveEmailError("");
  };

  const resetResetModalState = () => {
    setShowResetModal(false);
    setResetTargetStudent(null);
    setResetConfirmEmail("");
    setResetEmailError("");
    setNewPassword("");
    setIsResettingPassword(false);
  };

  const openResetModal = (student: Student) => {
    setResetTargetStudent({ id: student.id, name: student.name, email: student.email });
    setResetConfirmEmail("");
    setResetEmailError("");
    setNewPassword("");
    setIsResettingPassword(false);
    setShowResetModal(true);
  };

  const handleConfirmReset = async () => {
    if (!resetTargetStudent) return;
    if (resetConfirmEmail.trim().toLowerCase() !== resetTargetStudent.email.toLowerCase()) {
      setResetEmailError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    const generated = generateSecurePassword();
    setIsResettingPassword(true);

    try {
      const res = await fetch(`/api/admin/management/students/${resetTargetStudent.id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: generated })
      });

      if (!res.ok) throw new Error("Failed to reset password");
      
      setNewPassword(generated);
      toast.success("รีเซ็ตรหัสผ่านสำเร็จ");
    } catch (err) {
      toast.error("รีเซ็ตรหัสผ่านไม่สำเร็จ");
      setIsResettingPassword(false);
    }
  };

  const openRemoveModal = (student: Student) => {
    setTargetStudent({ id: student.id, name: student.name, email: student.email });
    setRemoveConfirmEmail("");
    setRemoveEmailError("");
    setShowRemoveModal(true);
  };

  const handleConfirmRemove = async () => {
    if (!targetStudent) return;
    if (removeConfirmEmail.trim().toLowerCase() !== targetStudent.email.toLowerCase()) {
      setRemoveEmailError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    await removeStudent(targetStudent.email);
    setShowRemoveModal(false);
    resetRemoveModalState();
  };

  const copyText = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`คัดลอก${label}แล้ว`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex-col">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="animate-fade-up delay-0 flex items-center justify-between gap-4 flex-wrap mb-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#9E76B4] text-white shrink-0">
              <Shield className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Account Management</h1>
                <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-transparent gap-1.5 select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Real-time
                </Badge>
              </div>
              <p className="text-sm text-gray-500 mt-0.5">จัดการสิทธิ์ผู้ดูแลระบบและบัญชีนักศึกษา</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหา..."
                className="pl-10 h-10 w-56 bg-white border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400"
              />
            </div>
            {isSuperAdmin && (
              <TabsList className="!h-10 bg-slate-100 border border-gray-200 p-1 rounded-xl gap-1">
                <TabsTrigger
                  value="admin"
                  className="gap-2 rounded-lg px-4 h-full text-slate-500 font-medium text-sm hover:text-slate-900
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:text-slate-900
                    transition-all duration-200"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </TabsTrigger>
                <TabsTrigger
                  value="student"
                  className="gap-2 rounded-lg px-4 h-full text-slate-500 font-medium text-sm hover:text-slate-900
                    data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:font-semibold data-[state=active]:text-slate-900
                    transition-all duration-200"
                >
                  <GraduationCap className="h-4 w-4" />
                  Student
                </TabsTrigger>
              </TabsList>
            )}
          </div>
        </div>

        {/* ── ADMIN TAB ──────────────────────────────────────────────────── */}
        {isSuperAdmin && (
        <TabsContent value="admin" className="space-y-5 mt-0">
          {/* Add Admin Card */}
          <div className="animate-fade-up delay-100 bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#9E76B4]" />
              <h2 className="font-semibold text-slate-800">เพิ่ม Admin ใหม่</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <UserPlus className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddAdmin()}
                  placeholder="admin@cmu.ac.th"
                  className="pl-10 h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <Button
                onClick={handleAddAdmin}
                className="h-12 w-full sm:w-44 rounded-xl gap-2 bg-[#9E76B4] hover:bg-[#8A5FA0] text-white transition-all duration-300 active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                เพิ่ม Admin
              </Button>
            </div>
          </div>

          {/* Admin List Card */}
          <div className="animate-fade-up delay-200 bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-amber-500" />
                <h2 className="font-semibold text-slate-800">Admin ทั้งหมด</h2>
              </div>
              <Badge className="bg-[#F5EFF9] text-[#9E76B4] hover:bg-[#F5EFF9] border-transparent font-semibold">
                {filteredAdmins.length} คน
              </Badge>
            </div>
            <div className="divide-y divide-gray-50">
              {isLoadingAdmins ? (
                <div className="px-6 py-10 flex justify-center items-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin text-[#9E76B4]" />
                  <span className="ml-2">กำลังโหลด...</span>
                </div>
              ) : filteredAdmins.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-400">ไม่พบ Admin</div>
              ) : (
                filteredAdmins.map((a, idx) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-slate-50 transition-all duration-200 animate-fade-up"
                    style={{ animationDelay: `${300 + idx * 60}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#9E76B4] text-white font-semibold text-sm shrink-0">
                        {a.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium text-slate-800 truncate">{a.name}</div>
                        <div className="text-sm text-gray-400 truncate">{a.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm text-gray-400 hidden sm:inline">เพิ่มเมื่อ {a.addedAt}</span>
                      {currentUserEmail && a.email.toLowerCase() === currentUserEmail.toLowerCase() ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled
                          className="bg-gray-100 text-gray-400 gap-2 cursor-not-allowed rounded-xl"
                        >
                          <UserPlus className="h-4 w-4" />
                          ลบผู้ดูแล
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openRevokeModal(a)}
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 gap-2 transition-all duration-200 active:scale-95 rounded-xl"
                        >
                          <UserPlus className="h-4 w-4" />
                          ลบผู้ดูแล
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>
        )}

        {/* ── STUDENT TAB ────────────────────────────────────────────────── */}
        <TabsContent value="student" className="space-y-5 mt-0">
          {/* Add Student Card */}
          <div className="animate-fade-up delay-100 bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex flex-col gap-4 transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-[#9E76B4]" />
              <h2 className="font-semibold text-slate-800">เพิ่ม Student ใหม่</h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  value={studentEmail}
                  onChange={(e) => setStudentEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddStudent()}
                  placeholder="student@cmu.ac.th"
                  className="pl-10 h-12 rounded-xl border-gray-200 text-gray-900 placeholder:text-gray-400"
                />
              </div>
              <Button
                onClick={handleAddStudent}
                className="h-12 w-full sm:w-44 rounded-xl gap-2 bg-[#9E76B4] hover:bg-[#8A5FA0] text-white transition-all duration-300 active:scale-95"
              >
                <UserPlus className="h-4 w-4" />
                Add Student
              </Button>
            </div>
            <p className="text-xs text-gray-400">
              ระบบจะสร้างรหัสผ่านที่ปลอดภัย (14 ตัวอักษร) ให้อัตโนมัติ
            </p>
          </div>

          {/* Student List Card */}
          <div className="animate-fade-up delay-200 bg-white rounded-2xl border border-gray-100 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[#9E76B4]" />
                <h2 className="font-semibold text-slate-800">Student ทั้งหมด</h2>
              </div>
              <Badge className="bg-[#F5EFF9] text-[#9E76B4] hover:bg-[#F5EFF9] border-transparent font-semibold">
                {filteredStudents.length} คน
              </Badge>
            </div>
            <div className="divide-y divide-gray-50">
              {isLoadingStudents ? (
                <div className="px-6 py-10 flex justify-center items-center text-gray-400">
                  <Loader2 className="h-6 w-6 animate-spin text-[#9E76B4]" />
                  <span className="ml-2">กำลังโหลด...</span>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="px-6 py-10 text-center text-gray-400">
                  ยังไม่มี Student เพิ่มอีเมลด้านบนเพื่อเริ่มต้น
                </div>
              ) : (
                filteredStudents.map((s, idx) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50 transition-all duration-200 animate-fade-up"
                  style={{ animationDelay: `${300 + idx * 60}ms` }}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#9E76B4] text-white font-semibold text-sm shrink-0">
                      {s.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-slate-800 truncate">{s.name}</div>
                      <div className="text-sm text-gray-400 truncate">{s.email}</div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openResetModal(s)}
                    className="border border-purple-300 text-purple-600 hover:bg-purple-50 hover:text-purple-700 gap-2 transition-all duration-200 active:scale-95 rounded-lg px-3 py-1.5 text-sm"
                  >
                    <KeyRound className="h-4 w-4" />
                    รีเซ็ตรหัสผ่าน
                  </Button>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm text-gray-400 hidden sm:inline">เพิ่มเมื่อ {s.addedAt}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRemoveModal(s)}
                      className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 gap-2 transition-all duration-200 active:scale-95 rounded-xl"
                    >
                      <UserPlus className="h-4 w-4" />
                      ลบนักศึกษา
                    </Button>
                  </div>
                </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

      </Tabs>

      <AnimatePresence>
        {showRevokeModal && targetAdmin && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-150"
              onClick={resetRevokeModalState}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบผู้ดูแล</h3>
                <p className="mt-1 text-sm text-gray-600">
                  คุณกำลังจะลบ "{targetAdmin.name}" ออกจากระบบ
                </p>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium text-gray-700">กรุณากรอกอีเมลของผู้ดูแลเพื่อยืนยัน</label>
                  <motion.div
                    animate={emailError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <input
                      type="email"
                      value={confirmEmail}
                      onChange={(e) => {
                        setConfirmEmail(e.target.value);
                        setEmailError("");
                      }}
                      placeholder={targetAdmin.email}
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-400"
                    />
                  </motion.div>
                  {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={resetRevokeModalState}>
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={() => {
                      void handleConfirmRevoke();
                    }}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    ยืนยันการลบ
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showRemoveModal && targetStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-150"
              onClick={resetRemoveModalState}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900">ยืนยันการลบนักศึกษา</h3>
                <p className="mt-1 text-sm text-gray-600">
                  คุณกำลังจะลบ "{targetStudent.name}" ออกจากระบบ
                </p>

                <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </div>

                <div className="mt-4 space-y-2">
                  <label className="text-sm font-medium text-gray-700">กรุณากรอกอีเมลของนักศึกษาเพื่อยืนยัน</label>
                  <motion.div
                    animate={removeEmailError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                    transition={{ duration: 0.4 }}
                  >
                    <input
                      type="email"
                      value={removeConfirmEmail}
                      onChange={(e) => {
                        setRemoveConfirmEmail(e.target.value);
                        setRemoveEmailError("");
                      }}
                      placeholder={targetStudent.email}
                      className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-red-400"
                    />
                  </motion.div>
                  {removeEmailError && <p className="text-red-500 text-sm mt-1">{removeEmailError}</p>}
                </div>

                <div className="mt-6 flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={resetRemoveModalState}>
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={() => {
                      void handleConfirmRemove();
                    }}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    ยืนยันการลบ
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetModal && resetTargetStudent && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-black/30 transition-opacity duration-150"
              onClick={resetResetModalState}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-bold text-gray-900">รีเซ็ตรหัสผ่าน</h3>
                <p className="mt-1 text-sm text-gray-600">
                  คุณกำลังจะรีเซ็ตรหัสผ่านของ "{resetTargetStudent.name}"
                </p>

                {!newPassword ? (
                  <>
                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-medium text-gray-700">กรุณากรอกอีเมลของนักศึกษาเพื่อยืนยัน</label>
                      <motion.div
                        animate={resetEmailError ? { x: [0, -8, 8, -8, 8, 0] } : {}}
                        transition={{ duration: 0.4 }}
                      >
                        <input
                          type="email"
                          value={resetConfirmEmail}
                          onChange={(e) => {
                            setResetConfirmEmail(e.target.value);
                            setResetEmailError("");
                          }}
                          placeholder={resetTargetStudent.email}
                          className="h-11 w-full rounded-xl border border-gray-300 px-3 text-sm text-gray-900 outline-none focus:border-purple-400"
                        />
                      </motion.div>
                      {resetEmailError && <p className="text-red-500 text-sm mt-1">{resetEmailError}</p>}
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-2">
                      <Button variant="outline" onClick={resetResetModalState} disabled={isResettingPassword}>
                        ยกเลิก
                      </Button>
                      <Button
                        onClick={() => {
                          void handleConfirmReset();
                        }}
                        disabled={isResettingPassword}
                        className="bg-purple-600 text-white hover:bg-purple-700"
                      >
                        {isResettingPassword ? "กำลังดำเนินการ..." : "ยืนยัน"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-4 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-center">
                      <p className="text-sm font-medium text-green-700">รีเซ็ตรหัสผ่านสำเร็จ ✓</p>
                    </div>

                    <div className="mt-4 space-y-2">
                      <label className="text-sm font-medium text-gray-700">รหัสผ่านใหม่</label>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 bg-gray-100 rounded-lg px-4 py-2 font-mono text-sm text-gray-900 break-all">
                          {newPassword}
                        </code>
                        <button
                          onClick={() => copyText(newPassword, "รหัสผ่าน")}
                          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all duration-200"
                          aria-label="copy password"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                      <p className="text-sm text-amber-700">
                        <strong>⚠️ สำคัญ:</strong> กรุณาแจ้งรหัสผ่านนี้แก่นักศึกษาทันที รหัสผ่านจะไม่ถูกแสดงอีกครั้ง
                      </p>
                    </div>

                    <div className="mt-6 flex items-center justify-end">
                      <Button
                        onClick={resetResetModalState}
                        className="bg-purple-600 text-white hover:bg-purple-700"
                      >
                        ปิด
                      </Button>
                    </div>
                  </>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
