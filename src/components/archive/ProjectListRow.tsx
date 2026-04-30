"use client"

import { Project } from "@/data/projects";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, ChevronRight } from "lucide-react";

interface ProjectListRowProps {
  project: Project;
  onView: (p: Project) => void;
}

export function ProjectListRow({ project, onView }: ProjectListRowProps) {
  return (
    <div 
      className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-surface transition-colors cursor-pointer"
      onClick={() => onView(project)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView(project);
        }
      }}
    >
      <div className="md:col-span-6 flex flex-col justify-center">
        <div className="space-y-1">
          <h3 className="font-semibold text-foreground group-hover:text-primary-orange transition-colors line-clamp-1">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-1">
            {project.students.join(", ")}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {project.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="md:col-span-3 flex flex-col justify-center text-sm">
        <span className="font-medium">{project.major}</span>
        <span className="text-muted-foreground text-xs">{project.faculty}</span>
      </div>

      <div className="md:col-span-1 flex items-center">
        <Badge variant="outline" className="text-[10px]">
          {project.type}
        </Badge>
      </div>

      <div className="md:col-span-1 flex items-center text-sm font-medium">
        {project.year}
      </div>

      <div className="md:col-span-1 flex items-center justify-end gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ProjectListRowSkeleton() {
  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 animate-pulse">
      <div className="col-span-6 flex flex-col justify-center">
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-muted rounded w-3/4" />
          <div className="h-3 bg-muted rounded w-1/2" />
        </div>
      </div>
      <div className="col-span-3 space-y-2 py-2">
        <div className="h-3 bg-muted rounded w-3/4" />
        <div className="h-2 bg-muted rounded w-1/2" />
      </div>
      <div className="col-span-1 flex items-center">
        <div className="h-5 w-16 bg-muted rounded" />
      </div>
      <div className="col-span-1 flex items-center">
        <div className="h-4 w-8 bg-muted rounded" />
      </div>
    </div>
  );
}
