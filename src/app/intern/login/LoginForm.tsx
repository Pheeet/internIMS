"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const OAUTH_ERRORS: Record<string, string> = {
  unauthorized: "บัญชีนี้ไม่ได้รับอนุญาต กรุณาติดต่อ Admin",
  suspended: "บัญชีถูกระงับ กรุณาติดต่อ Admin",
  account_disabled: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อ Admin",
  not_cmu: "กรุณาใช้อีเมล CMU (@cmu.ac.th) ในการเข้าสู่ระบบ",
  not_nursing_faculty: "ระบบนี้สำหรับนักศึกษาและบุคลากรคณะพยาบาลศาสตร์เท่านั้น",
  oauth_state_mismatch: "เกิดข้อผิดพลาดด้านความปลอดภัย กรุณาลองใหม่",
  oauth_token_failed: "ไม่สามารถยืนยันตัวตนได้ กรุณาลองใหม่",
  oauth_userinfo_failed: "ไม่สามารถดึงข้อมูลผู้ใช้ได้ กรุณาลองใหม่",
  oauth_error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่",
  server: "เกิดข้อผิดพลาด กรุณาลองใหม่",
};

const TOS_SECTIONS = [
  {
    title: "1. วัตถุประสงค์ของระบบ",
    body: "ระบบนี้จัดทำขึ้นเพื่ออำนวยความสะดวกแก่นักศึกษาและเจ้าหน้าที่ ในการยื่นคำร้อง ส่งเอกสาร ติดตามสถานะ และจัดการข้อมูลที่เกี่ยวข้องกับการฝึกงาน ข้อมูลทั้งหมดจะถูกนำไปใช้เพื่อประโยชน์ทางการศึกษาและการประสานงานกับสถานประกอบการ/แหล่งฝึกปฏิบัติงานเท่านั้น",
    bullets: [],
  },
  {
    title: "2. การเก็บรวบรวมและการใช้ข้อมูลส่วนบุคคล (ตามหลัก พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล - PDPA)",
    body: "เพื่อให้การดำเนินการฝึกงานเป็นไปอย่างสมบูรณ์ ทางคณะฯ มีความจำเป็นต้องเก็บรวบรวมข้อมูลส่วนบุคคลของท่าน ดังนี้:",
    bullets: [
      "ข้อมูลทั่วไป: ชื่อ-นามสกุล, รหัสนักศึกษา, อีเมล, หมายเลขโทรศัพท์",
      "ข้อมูลผู้ปกครอง/ผู้ติดต่อฉุกเฉิน: ชื่อ-นามสกุล, ความสัมพันธ์, หมายเลขโทรศัพท์",
      "เอกสารประกอบการพิจารณา: ใบสมัครฝึกงาน, เอกสารแสดงผลการเรียน (Transcript), และเอกสารอื่นๆ ที่เกี่ยวข้อง",
      "วัตถุประสงค์การใช้งาน: เพื่อใช้พิจารณาอนุมัติการฝึกงาน, ติดต่อประสานงานในกรณีฉุกเฉิน, และจัดทำหนังสือส่งตัวไปยังสถานประกอบการ",
    ],
  },
  {
    title: "3. ระยะเวลาในการเก็บรักษาข้อมูล",
    body: "ข้อมูลส่วนบุคคลและเอกสารของท่านจะถูกจัดเก็บไว้ในระบบอย่างปลอดภัยตลอดระยะเวลาที่ท่านมีสถานะเป็นนักศึกษาฝึกงาน และจะถูกเก็บรักษาไว้เป็นเวลา 10 ปี หลังจากเสร็จสิ้นการฝึกงาน เพื่อประโยชน์ในการอ้างอิงและตรวจสอบย้อนหลังตามระเบียบของทางคณะฯ หลังจากนั้นข้อมูลจะถูกลบหรือทำลายตามระเบียบของทางคณะฯ",
    bullets: [],
  },
  {
    title: "4. หน้าที่และความรับผิดชอบของผู้ใช้งาน",
    body: "",
    bullets: [
      "นักศึกษาต้องกรอกข้อมูลที่เป็นความจริง ถูกต้อง และเป็นปัจจุบันที่สุด",
      "การอัปโหลดเอกสารเข้าสู่ระบบ (เช่น Transcript, หนังสือรับรอง) จะต้องเป็นเอกสารที่ถูกต้อง ห้ามมิให้มีการปลอมแปลงหรือดัดแปลงเอกสารโดยเด็ดขาด การกระทำดังกล่าวถือเป็นความผิดทางวินัยขั้นร้ายแรง",
      "ผู้ใช้งานต้องเก็บรักษารหัสผ่านและข้อมูลการเข้าสู่ระบบของตนเองไว้เป็นความลับ และไม่ยินยอมให้บุคคลอื่นเข้าใช้งานบัญชีของตน",
    ],
  },
  {
    title: "5. สิทธิของผู้ดูแลระบบ (Admin)",
    body: "",
    bullets: [
      "ผู้ดูแลระบบมีสิทธิในการตรวจสอบ ขอให้แก้ไข (Action Required) หรือปฏิเสธเอกสารที่ไม่ตรงตามเงื่อนไขของทางคณะฯ",
      "หากตรวจพบการทุจริต หรือการใช้งานที่ผิดวัตถุประสงค์ ผู้ดูแลระบบขอสงวนสิทธิ์ในการระงับการใช้งานบัญชีของท่านทันทีโดยไม่ต้องแจ้งให้ทราบล่วงหน้า",
    ],
  },
  {
    title: "6. สิทธิของเจ้าของข้อมูล",
    body: "นักศึกษามีสิทธิในการเข้าถึง ขอแก้ไข หรืออัปเดตข้อมูลของตนเองให้เป็นปัจจุบันผ่านระบบ หากประสงค์จะขอลบข้อมูล หรือถอนความยินยอม สามารถติดต่อเจ้าหน้าที่ผู้ดูแลโครงการได้โดยตรง",
    bullets: [],
  },
  {
    title: "7. ช่องทางการติดต่อ",
    body: "หากมีข้อสงสัยเกี่ยวกับการใช้งานระบบ หรือนโยบายความเป็นส่วนตัว สามารถติดต่อได้ที่:",
    bullets: [
      "หน่วยงาน: หน่วยพัฒนาเทคโนโลยีสารสนเทศ คณะพยาบาลศาสตร์",
      "อีเมล: nupong.pr@cmu.ac.th",
    ],
  },
];

export default function LoginForm({ initialErrorKey = "" }: { initialErrorKey?: string }) {
  // Login form state
  const [isTermsAccepted, setIsTermsAccepted] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [pendingAuthAction, setPendingAuthAction] = useState<(() => void) | null>(null);
  const [loginError, setLoginError] = useState("");
  const [tosScrolledToBottom, setTosScrolledToBottom] = useState(false);
  const [error, setError] = useState("");

  const tosContentRef = useRef<HTMLDivElement>(null);

  // Resolve error message from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlKey = params.get("error") ?? initialErrorKey;
    if (urlKey && OAUTH_ERRORS[urlKey]) {
      setError(OAUTH_ERRORS[urlKey]);
    }
    if (params.get("error")) {
      requestAnimationFrame(() => {
        window.history.replaceState(null, "", "/intern/login");
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTosScroll = useCallback(() => {
    const el = tosContentRef.current;
    if (!el || tosScrolledToBottom) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 8) {
      setTosScrolledToBottom(true);
    }
  }, [tosScrolledToBottom]);

  const openTosModal = (e: React.MouseEvent) => {
    e.preventDefault();
    setTosScrolledToBottom(false);
    setPendingAuthAction(null);
    setShowTermsModal(true);
  };

  const closeTosModal = () => {
    setShowTermsModal(false);
    setPendingAuthAction(null);
    setLoginError("กรุณายอมรับข้อกำหนดการใช้งานก่อนเข้าสู่ระบบ");
  };

  const handleGoogleLogin = () => {
    if (!isTermsAccepted) {
      setTosScrolledToBottom(false);
      setShowTermsModal(true);
      setPendingAuthAction(() => () => {
        window.location.href = "/api/auth/google";
      });
      return;
    }
    window.location.href = "/api/auth/google";
  };

  const handleCMULogin = () => {
    if (!isTermsAccepted) {
      setTosScrolledToBottom(false);
      setShowTermsModal(true);
      setPendingAuthAction(() => () => {
        window.location.href = "/api/auth/cmu";
      });
      return;
    }
    window.location.href = "/api/auth/cmu";
  };

  const handleAcceptTerms = async () => {
    setIsTermsAccepted(true);
    setShowTermsModal(false);
    setLoginError("");
    if (pendingAuthAction) {
      pendingAuthAction();
      setPendingAuthAction(null);
    }
  };

  return (
    <>
      <main className="relative min-h-screen w-full overflow-hidden flex items-center justify-center px-4 py-10 bg-[linear-gradient(135deg,_#fff5ee_0%,_#fde8d8_40%,_#fef3ec_100%)]">
        {/* Card */}
        <section aria-labelledby="login-title" className="relative w-full max-w-md animate-fade-up">
          <div className="gradient-card backdrop-blur-xl border border-white/60 rounded-3xl shadow-card px-6 py-8 sm:px-10 sm:py-10">
            {/* Logo */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-4 sm:mb-5">
                <div className="relative w-[66px] h-[66px] overflow-hidden flex-shrink-0" style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}>
                  <Image src="/logo.png" alt="IMS Logo" width={66} height={66} className="w-full h-full object-cover" priority />
                </div>
              </div>
              <h1 id="login-title" className="text-2xl sm:text-[1.65rem] font-bold tracking-tight text-gray-900 leading-tight">Internship Management System</h1>
              <p className="mt-1.5 text-sm text-muted-foreground">เข้าสู่ระบบด้วยบัญชีของคุณ</p>
            </div>

            {/* OAuth Login Options */}
            <div className="mt-8 space-y-6">
              {error && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                  <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-4 py-3 rounded-xl flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <button type="button" onClick={handleGoogleLogin} className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-xl border border-border/80 bg-card hover:bg-secondary/60 hover:-translate-y-0.5 transition-smooth shadow-soft text-sm font-semibold text-gray-800">
                  <svg width="22" height="22" viewBox="0 0 18 18"><path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908C16.658 14.013 17.64 11.706 17.64 9.2z" fill="#4285F4" /><path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" /><path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" /><path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" /></svg>
                  Login with Google Account
                </button>
                <button type="button" onClick={handleCMULogin} className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-xl border border-border/80 bg-card hover:bg-secondary/60 hover:-translate-y-0.5 transition-smooth shadow-soft text-sm font-semibold text-gray-800">
                  <Image src="/CMU SUB-LOGO-01.png" alt="CMU Logo" width={32} height={32} className="object-contain" />
                  Login with CMU Account
                </button>
              </div>

              <div className="flex items-start gap-2.5 pt-4">
                <input type="checkbox" id="tos" checked={isTermsAccepted} onChange={(e) => { setIsTermsAccepted(e.target.checked); if (e.target.checked) setLoginError(""); }} className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-orange-500 cursor-pointer flex-shrink-0" />
                <Label htmlFor="tos" className="text-sm text-muted-foreground font-normal leading-relaxed cursor-default">
                  ฉันได้อ่านและยอมรับ <button type="button" onClick={openTosModal} className="font-semibold hover:underline underline-offset-4 transition-smooth" style={{ color: "#F26522" }}>Terms of Service</button>
                </Label>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">© {new Date().getFullYear()} Internship Management System · CMU</p>
        </section>
      </main>

      {/* ToS Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/20 backdrop-blur-xs" onClick={closeTosModal} />
            <div className="fixed inset-0 z-[51] flex items-center justify-center p-4 sm:p-6">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 8 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 8 }} className="w-full sm:max-w-lg bg-white rounded-xl ring-1 ring-foreground/10 p-0 flex flex-col overflow-hidden max-h-[80vh]">
                <div className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0">
                  <h2 className="text-base font-semibold text-gray-900">Terms of Service</h2>
                  <Button variant="ghost" size="icon" onClick={closeTosModal} className="text-muted-foreground hover:text-foreground"><X /></Button>
                </div>
                <div ref={tosContentRef} onScroll={handleTosScroll} className="flex-1 px-6 py-5 space-y-3 overflow-y-auto max-h-[60vh]">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-gray-900">ข้อกำหนดและนโยบายความเป็นส่วนตัว</h3>
                    {TOS_SECTIONS.map((section, i) => (
                      <div key={i} className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                        <h4 className="text-sm font-semibold text-gray-800">{section.title}</h4>
                        {section.body && <p className="text-sm text-gray-600">{section.body}</p>}
                        {section.bullets.length > 0 && (
                          <ul className="space-y-1.5">
                            {section.bullets.map((item, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-gray-600">
                                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-muted-foreground/50 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="px-6 py-4 border-t bg-white">
                  {!tosScrolledToBottom && <p className="text-xs text-muted-foreground text-center mb-3">เลื่อนอ่านจนถึงด้านล่างเพื่อกดยืนยัน</p>}
                  <Button onClick={handleAcceptTerms} disabled={!tosScrolledToBottom} className="w-full text-white" style={{ backgroundColor: "#DC5C04" }}>ยอมรับ</Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
