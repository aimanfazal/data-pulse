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

export function EmptyState() {
  const { loadSample, loading } = useDashboard();
  return (
    <div className="grid min-h-[70vh] place-items-center px-4 py-10">
      <div className="card-surface w-full max-w-xl p-10 text-center">
        <div
          className="mx-auto grid size-14 place-items-center rounded-2xl text-primary-foreground"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <BarChart3 className="size-7" />
        </div>
        <h2 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
          No dataset loaded yet
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
          Upload a sales CSV (order date, product, category, region, amounts) or load the
          built-in sample dataset to explore the dashboard right away.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Button onClick={loadSample} disabled={loading}>
            <Sparkles className="size-4" />
            {loading ? "Preparing data…" : "Load sample data"}
          </Button>
          <UploadButton />
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Expected columns: order_id, order_date, customer_id, customer_name, product_name,
          category, quantity, unit_price, total_amount, region, payment_method
        </p>
      </div>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="grid gap-4 p-6 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="card-surface h-32 animate-pulse bg-muted/60"
          style={{ animationDelay: `${i * 60}ms` }}
        />
      ))}
    </div>
  );
}
