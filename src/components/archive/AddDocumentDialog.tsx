"use client";

import { useState, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Upload, FileText, X, Loader2, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FACULTIES,
  PROJECT_TYPES,
  YEARS,
  ADVISORS,
  TAGS,
  ProjectType,
} from "@/data/projects";
import { toast } from "sonner";
import { StudentTagInput } from "./StudentTagInput";

interface AddDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AddDocumentSchema = z.object({
  title: z.string().min(1, "กรุณาระบุชื่อผลงาน"),
  students: z.string().min(1, "กรุณาเลือกผู้จัดทำอย่างน้อย 1 คน"),
  type: z.string().min(1, "กรุณาเลือกประเภท"),
  year: z.string().min(1, "กรุณาเลือกปีการศึกษา"),
  faculty: z.string().min(1, "กรุณาเลือกคณะ"),
  major: z.string().optional(),
  advisor: z.string().optional(),
  description: z.string().min(1, "กรุณาระบุคำอธิบายผลงาน"),
  tags: z.array(z.string()).min(1, "กรุณาเลือกคำสำคัญอย่างน้อย 1 รายการ"),
  file: z.any().refine((file) => file instanceof File, "กรุณาแนบไฟล์เอกสาร"),
});

type AddDocumentFormValues = z.infer<typeof AddDocumentSchema>;

export function AddDocumentDialog({ open, onOpenChange }: AddDocumentDialogProps) {
  const [advisors, setAdvisors] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingAdvisors, setLoadingAdvisors] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddDocumentFormValues>({
    resolver: zodResolver(AddDocumentSchema),
    defaultValues: {
      title: "",
      students: "",
      type: "",
      year: "",
      faculty: "",
      major: "",
      advisor: "",
      description: "",
      tags: [],
      file: null,
    },
  });

  const selectedFaculty = watch("faculty");

  // Fetch advisors and student profile on mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingAdvisors(true);
      try {
        const [advisorsRes, profileRes] = await Promise.all([
          fetch("/api/advisors"),
          fetch("/api/student/dashboard")
        ]);
        
        const advisorsData = await advisorsRes.json();
        setAdvisors(advisorsData);

        const profileData = await profileRes.json();
        if (profileData.profile) {
          setValue("faculty", profileData.profile.faculty || "");
          setValue("major", profileData.profile.major || "");
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoadingAdvisors(false);
      }
    };
    fetchData();
  }, [setValue]);

  // Removed department fetching logic as major is now from profile

  const onSubmit = (data: AddDocumentFormValues) => {
    toast.success(`เพิ่มเอกสาร "${data.title}" สำเร็จ`);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset();
        onOpenChange(o);
      }}
    >
      <DialogContent className="p-0 w-[90vw] max-w-2xl overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-2xl font-bold text-primary-orange">เพิ่มเอกสารผลงาน</DialogTitle>
          <DialogDescription>
            กรอกรายละเอียดผลงานเพื่อเพิ่มเข้าสู่คลังเก็บงานนักศึกษา
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[65vh] px-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2 pb-6">
            <div className="space-y-2">
              <Label htmlFor="title">
                ชื่อผลงาน <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    id="title"
                    placeholder="เช่น ระบบจัดการห้องสมุดอัจฉริยะ"
                    className={errors.title ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                )}
              />
              {errors.title && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title?.message?.toString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>ผู้จัดทำ (ค้นหารายชื่อ) <span className="text-destructive">*</span></Label>
              <Controller
                name="students"
                control={control}
                render={({ field }) => (
                  <StudentTagInput
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              {errors.students && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.students?.message?.toString()}
                </p>
              )}
            </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>
                ประเภท <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.type ? "border-destructive" : ""}>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.type && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.type?.message?.toString()}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>
                ปีการศึกษา <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="year"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className={errors.year ? "border-destructive" : ""}>
                      <SelectValue placeholder="เลือกปี" />
                    </SelectTrigger>
                    <SelectContent>
                      {YEARS.map((y) => (
                        <SelectItem key={y} value={y}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.year && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.year?.message?.toString()}
                </p>
              )}
            </div>
          </div>

            {/* Faculty and Major are automatically fetched from student profile and sent in background */}

          <div className="space-y-2">
            <Label>อาจารย์ที่ปรึกษา</Label>
            <Controller
              name="advisor"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange} disabled={loadingAdvisors}>
                  <SelectTrigger>
                    {loadingAdvisors ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>กำลังโหลด...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="เลือกอาจารย์ที่ปรึกษา" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {advisors.map((a) => (
                      <SelectItem key={a} value={a}>
                        {a}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">คำอธิบายผลงาน <span className="text-destructive">*</span></Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea
                  {...field}
                  id="description"
                  placeholder="อธิบายโดยย่อเกี่ยวกับผลงานชิ้นนี้…"
                  rows={4}
                  className={errors.description ? "border-destructive focus-visible:ring-destructive" : ""}
                />
              )}
            />
            {errors.description && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.description?.message?.toString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>คำสำคัญ <span className="text-destructive">*</span> <span className="text-xs font-normal text-muted-foreground">(คลิกเพื่อเลือก)</span></Label>
            <Controller
              name="tags"
              control={control}
              render={({ field }) => (
                <div className={`flex flex-wrap gap-2 rounded-lg border p-3 ${errors.tags ? "border-destructive bg-destructive/5" : "border-border bg-surface/50"}`}>
                  {TAGS.map((t) => {
                    const selected = field.value?.includes(t);
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          const next = selected
                            ? field.value.filter((val: string) => val !== t)
                            : [...(field.value || []), t];
                          field.onChange(next);
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition ${
                          selected
                            ? "bg-primary-orange text-white shadow-sm"
                            : "bg-background text-foreground/75 border border-border hover:border-primary-orange/40 hover:text-primary-orange"
                        }`}
                      >
                        {t}
                        {selected && <X className="h-3 w-3" />}
                      </button>
                    );
                  })}
                </div>
              )}
            />
            {errors.tags ? (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.tags?.message?.toString()}
              </p>
            ) : (
              watch("tags")?.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  เลือกแล้ว {watch("tags").length} รายการ
                </p>
              )
            )}
          </div>

          <div className="space-y-2">
            <Label>แนบไฟล์เอกสาร <span className="text-destructive">*</span></Label>
            <Controller
              name="file"
              control={control}
              render={({ field }) => (
                <>
                  {field.value ? (
                    <div className="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <FileText className="h-5 w-5 shrink-0 text-primary-orange" />
                        <div className="overflow-hidden">
                          <div className="truncate text-sm font-medium">{field.value.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {(field.value.size / 1024).toFixed(1)} KB
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => field.onChange(null)}
                        aria-label="Remove file"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label
                      htmlFor="file"
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-6 py-8 text-center transition hover:bg-surface ${errors.file ? "border-destructive bg-destructive/5 hover:border-destructive" : "border-border bg-surface/50 hover:border-primary-orange/40"}`}
                    >
                      <Upload className={`h-6 w-6 ${errors.file ? "text-destructive" : "text-muted-foreground"}`} />
                      <div className="text-sm font-medium">คลิกเพื่ออัปโหลดไฟล์</div>
                      <div className="text-xs text-muted-foreground">
                        PDF, DOCX, PPTX (สูงสุด 20MB)
                      </div>
                      <input
                        id="file"
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.ppt,.pptx"
                        onChange={(e) => field.onChange(e.target.files?.[0] ?? null)}
                      />
                    </label>
                  )}
                </>
              )}
            />
            {errors.file && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {errors.file?.message?.toString()}
              </p>
            )}
          </div>

          </form>
        </div>

        <DialogFooter className="px-6 pb-6 pt-4 border-t gap-2 sm:gap-0 flex-row justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl">
            ยกเลิก
          </Button>
          <Button 
            onClick={handleSubmit(onSubmit)}
            disabled={isSubmitting}
            className="bg-primary-orange text-white hover:bg-primary-hover rounded-xl shadow-sm min-w-[120px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>กำลังบันทึก...</span>
              </div>
            ) : "บันทึกเอกสาร"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
