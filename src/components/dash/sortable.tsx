import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export function useSort<T>(rows: T[], initialKey: keyof T, initialDir: "asc" | "desc" = "desc") {
  const [key, setKey] = useState<keyof T>(initialKey);
  const [dir, setDir] = useState<"asc" | "desc">(initialDir);

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return dir === "asc" ? cmp : -cmp;
    });
  }, [rows, key, dir]);

  const toggle = (next: keyof T) => {
    if (next === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setKey(next);
      setDir("desc");
    }
  };

  return { sorted, key, dir, toggle };
}

export function SortHeader<T>({
  label,
  field,
  sort,
  align = "left",
}: {
  label: string;
  field: keyof T;
  sort: { key: keyof T; dir: "asc" | "desc"; toggle: (k: keyof T) => void };
  align?: "left" | "right";
}) {
  const active = sort.key === field;
  const Icon = !active ? ChevronsUpDown : sort.dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={cn(
        "cursor-pointer select-none py-2 px-3 text-xs font-medium uppercase tracking-wide",
        align === "right" ? "text-right" : "text-left",
        active ? "text-foreground" : "text-muted-foreground",
      )}
      onClick={() => sort.toggle(field)}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "flex-row-reverse",
        )}
      >
        {label}
        <Icon className="size-3 opacity-70" />
      </span>
    </th>
  );
}
