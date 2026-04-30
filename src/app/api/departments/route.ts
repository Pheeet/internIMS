import { NextResponse } from "next/server";

const DEPARTMENTS: Record<string, string[]> = {
  "คณะวิทยาศาสตร์": ["วิทยาการคอมพิวเตอร์", "คณิตศาสตร์", "ฟิสิกส์", "เคมี"],
  "คณะวิศวกรรมศาสตร์": ["วิศวกรรมคอมพิวเตอร์", "วิศวกรรมไฟฟ้า", "วิศวกรรมโยธา", "วิศวกรรมสิ่งแวดล้อม"],
  "คณะเทคโนโลยีสารสนเทศ": ["เทคโนโลยีสารสนเทศ", "วิทยาการข้อมูล", "เน็ตเวิร์ก"],
  "คณะสถาปัตยกรรมศาสตร์": ["สถาปัตยกรรม", "การออกแบบภายใน"],
  "คณะครุศาสตร์อุตสาหกรรมและเทคโนโลยี": ["ครุศาสตร์วิศวกรรม", "เทคโนโลยีการศึกษา"]
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const faculty = searchParams.get("faculty");

  if (!faculty) {
    return NextResponse.json([]);
  }

  const departments = DEPARTMENTS[faculty] || [];
  return NextResponse.json(departments);
}
