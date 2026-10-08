import { type ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { exact } from "@/lib/analytics";

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("card-surface p-5", className)}>{children}</div>;
}

export function ChartCard({
  title,
  subtitle,
  action,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("flex flex-col gap-0 p-0 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-border/60">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
          {subtitle ? (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        {action}
      </div>
      {/* Body */}
      <div className="p-5">{children}</div>
    </Card>
  );
}

export function Delta({ value, className }: { value: number; className?: string }) {
  const flat = Math.abs(value) < 0.05;
  const up = value > 0;
  const Icon = flat ? Minus : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold num",
        flat
          ? "bg-muted text-muted-foreground"
          : up
            ? "bg-success/15 text-success"
            : "bg-destructive/15 text-destructive",
        className,
      )}
    >
      <Icon className="size-3.5" />
      {flat ? "0.0%" : `${Math.abs(value).toFixed(1)}%`}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  hint,
  icon,
}: {
  label: string;
  value: string;
  delta?: number;
  hint?: string;
  icon?: ReactNode;
}) {
  return (
    <div
      className="card-surface flex flex-col gap-3 p-5 border-t-[3px] border-t-primary/70 transition-all duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: "var(--shadow-card)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
        <span
          className="grid size-8 place-items-center rounded-lg text-white shadow-md"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          {icon}
        </span>
      </div>
      <div className="text-2xl font-bold tracking-tight num text-foreground">{value}</div>
      <div className="flex items-center gap-2">
        {delta === undefined ? null : <Delta value={delta} />}
        <span className="text-xs text-muted-foreground">{hint ?? "vs previous period"}</span>
      </div>
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  money = true,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number | string; color?: string; dataKey?: string }>;
  label?: string | number;
  money?: boolean;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-popover/90 backdrop-blur-md px-3.5 py-2.5 text-xs shadow-xl">
      {label !== undefined ? (
        <div className="mb-2 font-semibold text-popover-foreground text-[13px]">{label}</div>
      ) : null}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2.5 text-muted-foreground py-0.5">
          <span
            className="size-2.5 rounded-full shrink-0"
            style={{ backgroundColor: p.color ?? "var(--chart-1)" }}
          />
          <span className="capitalize">{p.name ?? p.dataKey}</span>
          <span className="ml-auto font-semibold num text-popover-foreground pl-4">
            {money && typeof p.value === "number" ? exact(p.value) : String(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export const CHART_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
];

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-l-4 border-primary pl-3">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
