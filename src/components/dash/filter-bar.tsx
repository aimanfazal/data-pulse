import { CalendarRange, ChevronDown, Download, RotateCcw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/lib/dashboard-store";
import { UploadButton } from "./empty-state";
import { downloadCsv } from "@/lib/csv";
import { customerStats, groupBy, kpis, productStats } from "@/lib/analytics";

function MultiSelect({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const hasSelected = selected.length > 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="justify-between gap-2 transition-all duration-150 hover:border-primary/50 hover:bg-primary/5"
        >
          {label}
          {hasSelected ? (
            <Badge
              className="bg-primary text-primary-foreground ring-1 ring-primary/30 shadow-sm"
              variant="secondary"
            >
              {selected.length}
            </Badge>
          ) : (
            <span className="text-muted-foreground text-xs">All</span>
          )}
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2">
        <div className="max-h-64 overflow-y-auto">
          {options.length === 0 ? (
            <p className="p-2 text-xs text-muted-foreground">No values available</p>
          ) : (
            options.map((opt) => {
              const checked = selected.includes(opt);
              return (
                <label
                  key={opt}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted transition-colors"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      onChange(
                        checked ? selected.filter((s) => s !== opt) : [...selected, opt],
                      )
                    }
                  />
                  <span className="truncate">{opt}</span>
                </label>
              );
            })
          )}
        </div>
        {hasSelected ? (
          <Button
            variant="ghost"
            size="sm"
            className="mt-1 w-full text-destructive hover:text-destructive hover:bg-destructive/8"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}

export function FilterBar() {
  const {
    filters,
    setFilters,
    resetFilters,
    options,
    bounds,
    orders,
    previousOrders,
    loadSample,
    sourceName,
  } = useDashboard();

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.regions.length > 0 ||
    filters.segments.length > 0 ||
    filters.from !== bounds.min ||
    filters.to !== bounds.max;

  const exportSummary = () => {
    const k = kpis(orders, previousOrders);
    const rows: (string | number)[][] = [
      ["Metric", "Value"],
      ["Source", sourceName || "—"],
      ["Date range", `${filters.from} to ${filters.to}`],
      ["Total revenue", k.revenue.toFixed(2)],
      ["Total orders", k.ordersCount],
      ["Average order value", k.aov.toFixed(2)],
      ["Total customers", k.customers],
      ["Units sold", k.units],
      ["Revenue growth vs previous period %", k.revenueGrowth.toFixed(2)],
      [],
      ["Category", "Revenue", "Orders", "Units"],
      ...groupBy(orders, "category").map((c) => [c.name, c.revenue, c.orders, c.units]),
      [],
      ["Region", "Revenue", "Orders", "AOV"],
      ...groupBy(orders, "region").map((r) => [r.name, r.revenue, r.orders, r.aov]),
      [],
      ["Top products", "Revenue", "Units", "Avg price"],
      ...productStats(orders)
        .slice(0, 10)
        .map((p) => [p.name, p.revenue, p.units, p.avgPrice]),
      [],
      ["Top customers", "Revenue", "Orders", "Segment"],
      ...customerStats(orders)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map((c) => [c.customer_name, Math.round(c.revenue), c.orders, c.segment]),
    ];
    downloadCsv(`sales-summary-${filters.from}_${filters.to}.csv`, rows);
    toast.success("Summary exported as CSV");
  };

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-sm md:px-6">
      {/* Date range */}
      <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1.5 transition-colors hover:border-primary/40">
        <CalendarRange className="size-4 text-primary" />
        <input
          type="date"
          value={filters.from}
          min={bounds.min}
          max={filters.to || bounds.max}
          onChange={(e) => setFilters({ from: e.target.value })}
          className="bg-transparent text-sm outline-none num"
        />
        <span className="text-muted-foreground">–</span>
        <input
          type="date"
          value={filters.to}
          min={filters.from || bounds.min}
          max={bounds.max}
          onChange={(e) => setFilters({ to: e.target.value })}
          className="bg-transparent text-sm outline-none num"
        />
      </div>

      <MultiSelect
        label="Category"
        options={options.categories}
        selected={filters.categories}
        onChange={(categories) => setFilters({ categories })}
      />
      <MultiSelect
        label="Region"
        options={options.regions}
        selected={filters.regions}
        onChange={(regions) => setFilters({ regions })}
      />
      <MultiSelect
        label="Segment"
        options={options.segments}
        selected={filters.segments}
        onChange={(segments) => setFilters({ segments })}
      />

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={resetFilters}
          className="text-destructive hover:text-destructive hover:bg-destructive/8"
        >
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        <span className="hidden text-xs font-medium text-primary lg:inline num">
          {orders.length.toLocaleString()} rows in view
        </span>
        <Button variant="ghost" size="sm" onClick={loadSample}>
          <Sparkles className="size-4" />
          Sample data
        </Button>
        <UploadButton />
        <Button
          size="sm"
          onClick={exportSummary}
          className="text-white shadow-md"
          style={{ backgroundImage: "var(--gradient-hero)" }}
        >
          <Download className="size-4" />
          Export summary
        </Button>
      </div>
    </div>
  );
}
