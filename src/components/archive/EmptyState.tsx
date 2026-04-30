"use client"

import { SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  onReset: () => void;
}

export function EmptyState({ onReset }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <SearchX className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-bold text-foreground">ไม่พบข้อมูลที่ค้นหา</h3>
      <p className="mt-2 text-muted-foreground max-w-xs">
        ลองปรับเปลี่ยนตัวกรองหรือคำค้นหาใหม่เพื่อให้ได้ผลลัพธ์ที่ต้องการ
      </p>
      <Button variant="outline" className="mt-8" onClick={onReset}>
        ล้างตัวกรองทั้งหมด
      </Button>
    </div>
  );
}
