"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Combobox, 
  ComboboxInput, 
  ComboboxOptions, 
  ComboboxOption 
} from "@headlessui/react";
import { X, Search, User, Loader2 } from "lucide-react";

interface Student {
  id: string;
  name: string;
}

interface StudentTagInputProps {
  value: string; // Comma separated names as per current state or I should change it to string[]?
  // The current AddDocumentDialog uses `const [students, setStudents] = useState("");`
  // and expects comma separated string. I'll maintain that for compatibility or update the parent.
  // Actually, I'll update the parent to use string[] if possible, but let's see.
  // The user said "change this from a plain text input to the StudentTagInput".
  onChange: (value: string) => void;
}

export function StudentTagInput({ value, onChange }: StudentTagInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  
  // Initialize selectedNames from comma separated string
  useEffect(() => {
    if (value) {
      const names = value.split(",").map(n => n.trim()).filter(n => n !== "");
      setSelectedNames(names);
    } else {
      setSelectedNames([]);
    }
  }, [value]);

  useEffect(() => {
    const fetchStudents = async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`/api/archive/students/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(data);
        }
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchStudents, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (studentName: string | null) => {
    if (!studentName || !studentName.trim()) return;
    
    if (!selectedNames.includes(studentName)) {
      const next = [...selectedNames, studentName];
      setSelectedNames(next);
      onChange(next.join(", "));
    }
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && query === "" && selectedNames.length > 0) {
      removeTag(selectedNames[selectedNames.length - 1]);
    }
  };

  const removeTag = (name: string) => {
    const next = selectedNames.filter(n => n !== name);
    setSelectedNames(next);
    onChange(next.join(", "));
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 min-h-[42px] p-1.5 rounded-lg border border-border bg-background focus-within:ring-2 focus-within:ring-primary-orange/20 focus-within:border-primary-orange/40 transition-all">
        {selectedNames.map((name) => (
          <span 
            key={name} 
            className="inline-flex items-center gap-1.5 bg-primary-orange/10 text-primary-orange px-2.5 py-1 rounded-full text-xs font-semibold border border-primary-orange/20"
          >
            {name}
            <button 
              type="button" 
              onClick={() => removeTag(name)}
              className="hover:bg-primary-orange/20 rounded-full p-0.5 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        
        <Combobox onChange={handleSelect}>
          <div className="relative flex-1 min-w-[120px]">
            <ComboboxInput
              className="w-full bg-transparent border-none outline-none text-sm py-1 px-1.5 placeholder:text-muted-foreground"
              placeholder={selectedNames.length === 0 ? "ค้นหารายชื่อนักศึกษา..." : ""}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
            />
            {loading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            )}
            
            <ComboboxOptions className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl bg-white py-1 text-sm shadow-xl ring-1 ring-black/5 focus:outline-none animate-in fade-in slide-in-from-top-1">
              {results.length === 0 && query.length >= 2 && !loading ? (
                <div className="py-3 px-4 text-center">
                  <p className="text-muted-foreground italic">ไม่พบรายชื่อในระบบ</p>
                  {/* Allow free text if student is not in DB? 
                      The user said "searches students from DB", 
                      but in an archive, sometimes we might need to add old names.
                      I'll allow adding the query as a name if Enter is pressed or chosen.
                  */}
                  <button
                    type="button"
                    onClick={() => handleSelect(query)}
                    className="mt-2 text-xs font-bold text-primary-orange hover:underline"
                  >
                    เพิ่มชื่อ &quot;{query}&quot;
                  </button>
                </div>
              ) : (
                results.map((s) => (
                  <ComboboxOption
                    key={s.id}
                    value={s.name}
                    className="relative cursor-pointer select-none py-2.5 pl-10 pr-4 text-foreground data-[focus]:bg-primary-orange/5 data-[focus]:text-primary-orange transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-surface-elevated flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="block truncate font-medium">{s.name}</span>
                    </div>
                  </ComboboxOption>
                ))
              )}
            </ComboboxOptions>
          </div>
        </Combobox>
      </div>
      <p className="text-[11px] text-muted-foreground">
        ค้นหาชื่อนักศึกษาจากระบบ และเลือกเพื่อเพิ่มเป็นผู้จัดทำ
      </p>
    </div>
  );
}
