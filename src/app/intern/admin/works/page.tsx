"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  FileText, 
  Download, 
  X, 
  Loader2, 
  Users, 
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import dayjs from "dayjs";
import "dayjs/locale/th";

dayjs.locale("th");

interface Work {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

interface StudentProfile {
  firstNameTh: string;
  lastNameTh: string;
  profilePictureUrl: string | null;
}

interface Student {
  id: string;
  email: string;
  studentProfile: StudentProfile | null;
  works: Work[];
}

export default function AdminWorksPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  
  // Modal state
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchStudents();
  }, [debouncedSearch]);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const url = debouncedSearch 
        ? `/api/admin/works?search=${encodeURIComponent(debouncedSearch)}`
        : "/api/admin/works";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      } else {
        toast.error("ไม่สามารถโหลดข้อมูลได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
    } finally {
      setIsLoading(false);
    }
  };

  const getInitials = (student: Student) => {
    const profile = student.studentProfile;
    if (!profile) return "?";
    return `${profile.firstNameTh[0]}${profile.lastNameTh[0]}`.toUpperCase();
  };

  const getFullName = (student: Student) => {
    const profile = student.studentProfile;
    if (!profile) return student.email;
    return `${profile.firstNameTh} ${profile.lastNameTh}`;
  };

  const formatDate = (date: string) => {
    return dayjs(date).format("DD MMM YYYY");
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">ผลงานนักศึกษา</h1>
        <p className="text-gray-500 mt-1">คลังผลงานของนักศึกษาที่สำเร็จการฝึกงาน</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
          <Search size={20} />
        </div>
        <input
          type="text"
          placeholder="ค้นหาชื่อนักศึกษาหรือชื่อผลงาน..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-purple-200 focus:border-purple-500 outline-none transition-all text-gray-700"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 h-24 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border-2 border-dashed border-gray-100">
          <div className="bg-gray-50 p-6 rounded-full mb-4">
            <Users size={48} className="text-gray-300" />
          </div>
          <p className="text-lg font-medium text-gray-600">ไม่พบข้อมูล</p>
          <p className="text-sm">ไม่พบนักศึกษาหรือผลงานที่ค้นหา</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((student) => (
            <motion.div
              key={student.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-lg shrink-0 overflow-hidden border border-purple-100">
                    {student.studentProfile?.profilePictureUrl ? (
                      <img 
                        src={student.studentProfile.profilePictureUrl} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(student)
                    )}
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-gray-800 truncate">{getFullName(student)}</p>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-50">
                <span className="text-sm font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg">
                  {student.works.length} ผลงาน
                </span>
                <button
                  onClick={() => setSelectedStudent(student)}
                  className="flex items-center gap-1.5 text-sm font-bold text-purple-600 hover:text-purple-700 transition-colors group/btn"
                >
                  ดูผลงาน
                  <ChevronRight size={16} className="group-hover/btn:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Works Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div>
                  <h3 className="text-xl font-bold text-gray-800">ผลงานของ {getFullName(selectedStudent)}</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
                <button 
                  onClick={() => setSelectedStudent(null)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar">
                {selectedStudent.works.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p>นักศึกษายังไม่มีผลงาน</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStudent.works.map((work) => (
                      <div 
                        key={work.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-purple-100 transition-all gap-4"
                      >
                        <div className="flex gap-4">
                          <div className="bg-white p-3 rounded-xl shadow-sm text-red-500 h-fit">
                            <FileText size={24} />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">{work.title}</p>
                            <p className="text-sm text-gray-600 mt-1">{work.description || "ไม่มีคำอธิบาย"}</p>
                            <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
                              <span>{formatDate(work.createdAt)}</span>
                              <span>•</span>
                              <span>{(work.fileSize / 1024).toFixed(0)} KB</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2 shrink-0">
                          <a
                            href={work.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-sm font-bold text-gray-700 border border-gray-200 hover:border-purple-200 hover:text-purple-600 transition-all shadow-sm"
                          >
                            <ExternalLink size={16} />
                            ดูไฟล์
                          </a>
                          <a
                            href={work.fileUrl}
                            download={work.fileName}
                            className="flex items-center justify-center w-10 h-10 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all shadow-md shadow-purple-100"
                            title="ดาวน์โหลด"
                          >
                            <Download size={18} />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setSelectedStudent(null)}
                  className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #d1d5db;
        }
      `}</style>
    </div>
  );
}
