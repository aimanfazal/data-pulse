import { BarChart3, Sparkles, Upload } from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";
import { useDashboard } from "@/lib/dashboard-store";
import { parseOrdersCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";

export function UploadButton({ variant = "outline" }: { variant?: "outline" | "secondary" }) {
  const { loadOrders } = useDashboard();
  const ref = useRef<HTMLInputElement>(null);

  return (
    <>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            const rows = await parseOrdersCsv(file);
            loadOrders(rows, file.name);
            toast.success(`Loaded ${rows.length.toLocaleString()} rows from ${file.name}`);
          } catch (err) {
            toast.error((err as Error).message || "Could not read that file");
          }
        }}
      />
      <Button variant={variant} onClick={() => ref.current?.click()}>
        <Upload className="size-4" />
        Upload CSV
      </Button>
    </>
  );
}

const CSV_COLUMNS = [
  "order_id", "order_date", "customer_id", "customer_name",
  "product_name", "category", "quantity", "unit_price",
  "total_amount", "region", "payment_method",
];

export function EmptyState() {
  const { loadSample, loading } = useDashboard();
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-10">
      <div className="card-surface w-full max-w-xl p-10 text-center">
        {/* Icon */}
        <div
          className="mx-auto grid size-16 place-items-center rounded-2xl text-white shadow-xl"
          style={{
            backgroundImage: "var(--gradient-hero)",
            boxShadow: "0 8px 32px -4px oklch(0.42 0.155 232 / 0.35)",
          }}
        >
          <BarChart3 className="size-8" />
        </div>

        <h2 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
          No dataset loaded yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
          Upload a sales CSV or load the built-in sample dataset to explore the dashboard
          instantly — no backend required.
        </p>

        {/* CTAs */}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button
            onClick={loadSample}
            disabled={loading}
            className="text-white shadow-md"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            <Sparkles className="size-4" />
            {loading ? "Preparing data…" : "Load sample data"}
          </Button>
          <UploadButton />
        </div>

        {/* Column hint */}
        <div className="mt-7">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Expected columns
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {CSV_COLUMNS.map((col) => (
              <code
                key={col}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
              >
                {col}
              </code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="space-y-5 p-4 md:p-6">
      {/* KPI skeleton row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="card-surface h-28 rounded-xl animate-shimmer"
            style={{ animationDelay: `${i * 80}ms` }}
          />
        ))}
      </div>
      {/* Chart skeleton */}
      <div
        className="card-surface h-72 rounded-xl animate-shimmer"
        style={{ animationDelay: "320ms" }}
      />
      {/* Two-col skeleton */}
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="card-surface h-72 rounded-xl animate-shimmer"
            style={{ animationDelay: `${400 + i * 80}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
