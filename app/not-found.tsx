import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <h2 className="text-4xl font-bold text-gray-900 mb-2">404</h2>
      <p className="text-gray-600 mb-6">ไม่พบหน้าที่คุณต้องการ</p>
      <Link
        href="/intern/login"
        className="px-6 py-2 bg-[#F26522] text-white rounded-lg font-bold hover:bg-[#e0561a] transition-colors"
      >
        กลับไปหน้าเข้าสู่ระบบ
      </Link>
    </div>
  );
}
