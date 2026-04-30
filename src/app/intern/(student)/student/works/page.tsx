"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, Folder, Users, Plus } from "lucide-react";
import { AddDocumentDialog } from "@/components/archive/AddDocumentDialog";
import { FilterPanel, EMPTY_FILTERS, Filters } from "@/components/archive/FilterPanel";
import { ProjectListRow, ProjectListRowSkeleton } from "@/components/archive/ProjectListRow";
import { EmptyState } from "@/components/archive/EmptyState";
import { ProjectDetailDialog } from "@/components/archive/ProjectDetailDialog";
import { FACULTIES, Project, PROJECTS, PROJECT_TYPES, ProjectType, YEARS } from "@/data/projects";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type SortKey = "newest" | "oldest" | "title";

// Color dot per project type — visual legend in the pill filter row
const TYPE_DOT: Record<ProjectType, string> = {
  Thesis:     "bg-emerald-500",
  Capstone:   "bg-rose-500",
  Research:   "bg-amber-500",
  Design:     "bg-sky-500",
  App:        "bg-violet-500",
  Website:    "bg-orange-500",
  Poster:     "bg-teal-500",
  Innovation: "bg-fuchsia-500",
};

const StudentWorksPage = () => {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>("newest");
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Project | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeType, setActiveType] = useState<ProjectType | "all">("all");
  const [faculty, setFaculty] = useState<string>("all");
  const [year, setYear] = useState<string>("all");
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 280);
    return () => clearTimeout(t);
  }, [query, filters, sort, activeType, faculty, year]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = PROJECTS.filter((p) => {
      if (activeType !== "all" && p.type !== activeType) return false;
      if (faculty !== "all" && p.faculty !== faculty) return false;
      if (year !== "all" && p.year !== year) return false;
      if (filters.years.length && !filters.years.includes(p.year)) return false;
      if (filters.faculties.length && !filters.faculties.includes(p.faculty)) return false;
      if (filters.types.length && !filters.types.includes(p.type)) return false;
      if (filters.advisors.length && !filters.advisors.includes(p.advisor)) return false;
      if (filters.tags.length && !filters.tags.some((t) => p.tags.includes(t))) return false;
      if (q) {
        const hay = [p.title, p.description, p.advisor, p.faculty, p.major, ...p.students, ...p.tags]
          .join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    if (sort === "newest")  list = [...list].sort((a, b) => Number(b.year) - Number(a.year));
    if (sort === "oldest")  list = [...list].sort((a, b) => Number(a.year) - Number(b.year));
    if (sort === "title")   list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [query, filters, sort, activeType, faculty, year]);

  const activeFilterCount =
    filters.years.length + filters.faculties.length + filters.types.length +
    filters.advisors.length + filters.tags.length;

  return (
    <div className="min-h-screen bg-background pt-4">

      <main className="container mx-auto mt-6 space-y-6 pb-16 px-4">
        {/* Top filter bar */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-card md:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ค้นหาชื่อผลงาน ผู้จัดทำ หรือหัวข้อ…"
                className="h-12 w-full rounded-full border border-border bg-surface pl-10 pr-4 text-sm outline-none transition focus:border-primary-orange/40 focus:ring-2 focus:ring-primary-orange/10"
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <Select value={faculty} onValueChange={setFaculty}>
                <SelectTrigger className="h-12 w-full rounded-full lg:w-56">
                  <Folder className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="ทุกคณะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกคณะ</SelectItem>
                  {FACULTIES.map((f) => (
                    <SelectItem key={f} value={f}>{f}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={year} onValueChange={setYear}>
                <SelectTrigger className="h-12 w-full rounded-full lg:w-44">
                  <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="ทุกปีการศึกษา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกปีการศึกษา</SelectItem>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={y}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={() => setAddOpen(true)}
                className="h-12 rounded-full bg-primary-orange px-6 font-semibold text-white shadow-card hover:bg-primary-hover ml-auto"
              >
                <Plus className="mr-1 h-4 w-4" />
                เพิ่มเอกสาร
              </Button>
            </div>
          </div>

          {/* Color-dot pill filters by project type */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-xs font-medium text-muted-foreground">ประเภท:</span>
            <button
              onClick={() => setActiveType("all")}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition ${
                activeType === "all"
                  ? "bg-primary-orange text-white"
                  : "bg-surface text-foreground/80 hover:bg-surface-elevated"
              }`}
            >
              ทั้งหมด
            </button>
            {PROJECT_TYPES.map((t) => {
              const isActive = activeType === t;
              return (
                <button
                  key={t}
                  onClick={() => setActiveType(t)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium transition ${
                    isActive
                      ? "bg-surface-elevated text-foreground ring-2 ring-primary-orange/40"
                      : "bg-surface text-foreground/80 hover:bg-surface-elevated"
                  }`}
                >
                  <span className={`h-2 w-2 rounded-full ${TYPE_DOT[t]}`} />
                  {t}
                </button>
              );
            })}
          </div>
        </section>

        {/* Projects list panel */}
        <section className="rounded-2xl border border-border bg-card shadow-card overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-col gap-4 border-b border-border p-6 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary-orange tracking-tight">
                คลังเอกสารนักศึกษาฝึกงาน
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ค้นหาและเรียกดูเอกสารผลงาน รายงาน และโครงงานของนักศึกษาฝึกงาน
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFiltersOpen(true)}
                className="h-10 rounded-xl"
              >
                <SlidersHorizontal className="mr-1.5 h-4 w-4" />
                ตัวกรอง
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-primary-orange px-1.5 text-[11px] font-semibold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>

              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="h-10 w-[160px] rounded-xl text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">ใหม่ล่าสุดก่อน</SelectItem>
                  <SelectItem value="oldest">เก่าที่สุดก่อน</SelectItem>
                  <SelectItem value="title">เรียงตามชื่อ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table header */}
          <div className="hidden grid-cols-12 gap-4 border-b border-border bg-surface/60 px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground md:grid">
            <div className="col-span-6">ผลงาน</div>
            <div className="col-span-3">สาขา / คณะ</div>
            <div className="col-span-1">ประเภท</div>
            <div className="col-span-1">ปี</div>
            <div className="col-span-1 text-right">การดำเนินการ</div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <ProjectListRowSkeleton key={i} />)
            ) : results.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  onReset={() => {
                    setQuery("");
                    setFilters(EMPTY_FILTERS);
                    setActiveType("all");
                    setFaculty("all");
                    setYear("all");
                  }}
                />
              </div>
            ) : (
              results.map((p) => (
                <ProjectListRow key={p.id} project={p} onView={setSelected} />
              ))
            )}
          </div>

          {!loading && results.length > 0 && (
            <div className="flex items-center justify-between border-t border-border px-6 py-4 text-xs text-muted-foreground">
              <span>
                แสดง <span className="font-semibold text-foreground">{results.length}</span> จากทั้งหมด {PROJECTS.length} รายการ
              </span>
              <span>ระบบจัดการนักศึกษาฝึกงาน</span>
            </div>
          )}
        </section>
      </main>

      {/* Filters drawer */}
      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-5">
          <FilterPanel filters={filters} onChange={setFilters} />
        </SheetContent>
      </Sheet>

      <ProjectDetailDialog
        project={selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onSelectRelated={(p) => setSelected(p)}
      />

      <AddDocumentDialog open={addOpen} onOpenChange={setAddOpen} />
    </div>
  );
};

export default StudentWorksPage;
