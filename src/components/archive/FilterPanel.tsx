"use client"

import { FACULTIES, PROJECT_TYPES, YEARS } from "@/data/projects";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export interface Filters {
  years: string[];
  faculties: string[];
  types: string[];
  advisors: string[];
  tags: string[];
}

export const EMPTY_FILTERS: Filters = {
  years: [],
  faculties: [],
  types: [],
  advisors: [],
  tags: [],
};

interface FilterPanelProps {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const toggleFilter = (key: keyof Filters, value: string) => {
    const current = filters[key];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onChange({ ...filters, [key]: next });
  };

  const clearFilters = () => onChange(EMPTY_FILTERS);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between py-4">
        <h2 className="text-lg font-semibold">ตัวกรอง</h2>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          ล้างทั้งหมด
        </Button>
      </div>

      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          <FilterGroup
            title="ปีการศึกษา"
            options={YEARS}
            selected={filters.years}
            onToggle={(v) => toggleFilter("years", v)}
          />
          <Separator />
          <FilterGroup
            title="คณะ"
            options={FACULTIES}
            selected={filters.faculties}
            onToggle={(v) => toggleFilter("faculties", v)}
          />
          <Separator />
          <FilterGroup
            title="ประเภทผลงาน"
            options={PROJECT_TYPES}
            selected={filters.types}
            onToggle={(v) => toggleFilter("types", v)}
          />
        </div>
      </ScrollArea>
    </div>
  );
}

interface FilterGroupProps {
  title: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}

function FilterGroup({ title, options, selected, onToggle }: FilterGroupProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium">{title}</h3>
      <div className="space-y-2">
        {options.map((opt: string) => (
          <div key={opt} className="flex items-center space-x-2">
            <Checkbox
              id={`filter-${opt}`}
              checked={selected.includes(opt)}
              onCheckedChange={() => onToggle(opt)}
            />
            <label
              htmlFor={`filter-${opt}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {opt}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
