export type ProjectType =
  | "Thesis"
  | "Capstone"
  | "Research"
  | "Design"
  | "App"
  | "Website"
  | "Poster"
  | "Innovation";

export interface ProjectAttachment {
  label: string;
  kind: "PDF" | "Slides" | "Demo" | "Poster" | "Repo";
  url: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  type: ProjectType;
  year: string;
  faculty: string;
  major: string;
  advisor: string;
  students: string[];
  tags: string[];
  imageUrl: string;
  fileUrl: string;
  viewCount: number;
  downloadCount: number;
  attachments: ProjectAttachment[];
}

export const PROJECT_TYPES: ProjectType[] = [
  "Thesis",
  "Capstone",
  "Research",
  "Design",
  "App",
  "Website",
  "Poster",
  "Innovation",
];

export const FACULTIES = [
  "คณะวิทยาศาสตร์",
  "คณะวิศวกรรมศาสตร์",
  "คณะเทคโนโลยีสารสนเทศ",
  "คณะสถาปัตยกรรมศาสตร์",
  "คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี",
];

export const YEARS = ["2567", "2566", "2565", "2564", "2563"];

export const ADVISORS = [
  "ผศ.ดร.สมชาย รักเรียน",
  "ดร.วิภาดา ใฝ่รู้",
  "รศ.ประเสริฐ สร้างสรรค์",
  "อาจารย์นารี มีสุข",
  "ดร.มานพ ขยันยิ่ง"
];

export const TAGS = [
  "React", "Next.js", "TypeScript", "Node.js", "Python",
  "AI", "Machine Learning", "IoT", "Mobile App", "Web App",
  "Sustainability", "Environment", "Design", "UX/UI"
];

export const PROJECTS: Project[] = [
  {
    id: "1",
    title: "ระบบจัดการนักศึกษาฝึกงาน (Internship Management System)",
    description: "ระบบเว็บแอปพลิเคชันสำหรับจัดการข้อมูลนักศึกษาฝึกงาน การส่งเอกสาร และการประเมินผล",
    longDescription: "โปรเจกต์นี้พัฒนาขึ้นเพื่อแก้ปัญหาความยุ่งยากในการจัดการเอกสารของนักศึกษาฝึกงาน โดยใช้เทคโนโลยีสมัยใหม่ เช่น Next.js และ Prisma เพื่อสร้างระบบที่มีประสิทธิภาพและใช้งานง่าย มีระบบแจ้งเตือนผ่านช่องทางต่างๆ และการจัดการสถานะที่ชัดเจน",
    type: "App",
    year: "2567",
    faculty: "คณะเทคโนโลยีสารสนเทศ",
    major: "เทคโนโลยีสารสนเทศ",
    advisor: "ผศ.ดร.สมชาย รักเรียน",
    students: ["นายธนาวิน รักดี", "นางสาวสมหญิง มุ่งมั่น"],
    tags: ["React", "Next.js", "Prisma", "PostgreSQL"],
    imageUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80",
    fileUrl: "#",
    viewCount: 1250,
    downloadCount: 450,
    attachments: [
      { label: "Document.pdf", kind: "PDF", url: "#" },
      { label: "Presentation.pptx", kind: "Slides", url: "#" },
      { label: "GitHub Repo", kind: "Repo", url: "#" },
    ]
  },
  {
    id: "2",
    title: "การวิเคราะห์พฤติกรรมการใช้งานโมบายแบงก์กิ้งในกลุ่มผู้สูงอายุ",
    description: "งานวิจัยศึกษาปัจจัยที่มีผลต่อการยอมรับและใช้งานแอปพลิเคชันธนาคารของผู้สูงอายุในกรุงเทพมหานคร",
    longDescription: "งานวิจัยนี้เน้นการศึกษาด้าน User Experience และ Accessibility โดยเฉพาะในกลุ่มผู้สูงอายุ เพื่อหาแนวทางในการออกแบบแอปพลิเคชันธนาคารให้เหมาะสมกับข้อจำกัดทางกายภาพและการรับรู้ของผู้ใช้งานกลุ่มนี้",
    type: "Research",
    year: "2566",
    faculty: "คณะวิทยาศาสตร์",
    major: "วิทยาการคอมพิวเตอร์",
    advisor: "ดร.วิภาดา ใฝ่รู้",
    students: ["นายสมพงษ์ ใจดี"],
    tags: ["UX/UI", "User Research", "Banking"],
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173bdb999ef?w=800&q=80",
    fileUrl: "#",
    viewCount: 840,
    downloadCount: 120,
    attachments: [
      { label: "Research_Paper.pdf", kind: "PDF", url: "#" },
      { label: "Survey_Data.xlsx", kind: "PDF", url: "#" },
    ]
  },
  {
    id: "3",
    title: "นวัตกรรมเครื่องกรองน้ำพลังงานแสงอาทิตย์สำหรับชุมชนห่างไกล",
    description: "การออกแบบและสร้างเครื่องกรองน้ำที่ใช้พลังงานสะอาดและวัสดุที่หาได้ง่ายในท้องถิ่น",
    longDescription: "โปรเจกต์เชิงวิศวกรรมที่นำพลังงานแสงอาทิตย์มาประยุกต์ใช้กับระบบกรองน้ำ เพื่อช่วยให้ชุมชนที่ขาดแคลนไฟฟ้าสามารถเข้าถึงน้ำดื่มสะอาดได้ โดยใช้วัสดุที่บำรุงรักษาง่ายและเป็นมิตรต่อสิ่งแวดล้อม",
    type: "Innovation",
    year: "2567",
    faculty: "คณะวิศวกรรมศาสตร์",
    major: "วิศวกรรมสิ่งแวดล้อม",
    advisor: "รศ.ประเสริฐ สร้างสรรค์",
    students: ["นายมานะ อดทน", "นายวิชัย กล้าหาญ"],
    tags: ["Sustainability", "Solar Energy", "Water Purification"],
    imageUrl: "https://images.unsplash.com/photo-1509391366360-feaffa648bd1?w=800&q=80",
    fileUrl: "#",
    viewCount: 2100,
    downloadCount: 680,
    attachments: [
      { label: "Technical_Manual.pdf", kind: "PDF", url: "#" },
      { label: "Project_Poster.jpg", kind: "Poster", url: "#" },
      { label: "Live_Demo", kind: "Demo", url: "#" },
    ]
  },
];
