"use client";

import { Project, PROJECTS } from "@/data/projects";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  FileText,
  GraduationCap,
  Link as LinkIcon,
  Presentation,
  Image as ImageIcon,
  Code2,
  ArrowUpRight
} from "lucide-react";

const ATTACHMENT_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  PDF: FileText,
  Slides: Presentation,
  Demo: LinkIcon,
  Poster: ImageIcon,
  Repo: Code2,
};

interface ProjectDetailDialogProps {
  project: Project | null;
  onOpenChange: (open: boolean) => void;
  onSelectRelated: (p: Project) => void;
}

export function ProjectDetailDialog({ project, onOpenChange, onSelectRelated }: ProjectDetailDialogProps) {
  if (!project) return null;

  const related = PROJECTS.filter(
    (p) => p.id !== project.id && (p.faculty === project.faculty || p.tags.some((t) => project.tags.includes(t))),
  ).slice(0, 3);

  return (
    <Dialog open={!!project} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] max-w-4xl overflow-hidden p-0">
        <header className="border-b border-border bg-surface px-6 py-6 md:px-8">
          <div className="flex flex-wrap items-center gap-3 text-[10px] md:text-xs">
            <span className="rounded-full bg-primary-orange/10 px-3 py-1 font-bold uppercase tracking-wider text-primary-orange">
              {project.type}
            </span>
            <span className="text-muted-foreground/80">{project.faculty} · {project.major}</span>
            <span className="ml-auto inline-flex items-center gap-1.5 font-medium text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
              ปีการศึกษา {project.year}
            </span>
          </div>
        </header>

        <div className="overflow-y-auto max-h-[75vh] px-6 pb-8 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8 w-full">
            {/* Left Column: Main Content */}
            <div className="md:col-span-2 space-y-10 min-w-0">
              <section className="space-y-4">
                <DialogTitle className="text-3xl md:text-4xl font-bold tracking-tight text-primary leading-tight">
                  {project.title}
                </DialogTitle>
                <DialogDescription className="text-base md:text-lg leading-relaxed text-muted-foreground">
                  {project.description}
                </DialogDescription>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-primary">
                  <FileText className="h-5 w-5 text-primary-orange" />
                  เกี่ยวกับโครงการ
                </h3>
                <div className="text-sm md:text-base leading-relaxed text-foreground/80 space-y-4">
                  {project.longDescription.split('\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-lg font-semibold text-primary">หัวข้อที่เกี่ยวข้อง</h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((t) => (
                    <span key={t} className="rounded-full bg-secondary/80 px-4 py-1.5 text-xs font-medium text-secondary-foreground">
                      {t}
                    </span>
                  ))}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-semibold text-primary">เอกสารแนบ</h3>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {project.attachments.map((a) => {
                    const Icon = ATTACHMENT_ICON[a.kind] ?? FileText;
                    return (
                      <li key={a.label}>
                        <a
                          href={a.url}
                          className="group flex items-center gap-4 rounded-xl border border-border bg-card p-4 transition-all hover:border-primary-orange/40 hover:shadow-md hover:bg-surface"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-orange/10 text-primary-orange group-hover:bg-primary-orange transition-colors">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{a.label}</p>
                            <p className="text-[11px] text-muted-foreground uppercase">{a.kind}</p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </section>
            </div>

            {/* Right Column: Metadata */}
            <aside className="md:col-span-1 min-w-0">
              <div className="rounded-2xl border border-border bg-surface/50 p-6 space-y-6 sticky top-0">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">ผู้จัดทำ</h4>
                  <div className="space-y-2">
                    {project.students.map((s) => (
                      <div key={s} className="flex items-center gap-3 p-2.5 rounded-lg bg-card border border-border/50">
                        <GraduationCap className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="text-sm font-medium text-foreground/90 whitespace-nowrap overflow-hidden text-ellipsis">
                          {s}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">อาจารย์ที่ปรึกษา</h4>
                  <p className="text-sm font-semibold text-foreground/90">{project.advisor}</p>
                </div>

                <div className="pt-4 border-t border-border">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">คณะ / สาขาวิชา</h4>
                  <p className="text-sm font-medium text-foreground/90 leading-snug">{project.faculty}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{project.major}</p>
                </div>

                <Button className="w-full bg-primary-orange hover:bg-primary-hover text-white shadow-glow h-11 rounded-xl">
                  ขอรับสำเนาไฟล์
                </Button>
              </div>
            </aside>
          </div>

          {related.length > 0 && (
            <div className="border-t border-border pt-10 pb-12">
              <h3 className="text-xl font-bold text-primary mb-6">โครงการที่เกี่ยวข้อง</h3>
              <ul className="grid gap-4 md:grid-cols-3">
                {related.map((r) => (
                  <li key={r.id}>
                    <button
                      onClick={() => onSelectRelated(r)}
                      className="group flex h-full w-full flex-col rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-primary-orange/40 hover:shadow-lg"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary-orange mb-2">{r.type}</span>
                      <span className="text-sm font-bold leading-tight text-primary line-clamp-2">
                        {r.title}
                      </span>
                      <div className="mt-auto pt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                        <span>{r.faculty}</span>
                        <span className="font-medium">{r.year}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
