import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Search, TrendingDown, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/dash/app-shell";
import { CHART_COLORS, Card, ChartCard, ChartTooltip, Delta } from "@/components/dash/primitives";
import { SortHeader, useSort } from "@/components/dash/sortable";
import { useDashboard } from "@/lib/dashboard-store";
import { currency, exact, groupBy, productStats, type ProductStat } from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Product Performance — Commerce IQ" },
      {
        name: "description",
        content:
          "Compare products by units sold, revenue, average price and growth, with category drill-down.",
      },
      { property: "og:title", content: "Product Performance — Commerce IQ" },
      {
        property: "og:description",
        content: "Spot top performers and underperformers across your product catalog.",
      },
    ],
  }),
  component: ProductsPage,
});

function ProductsPage() {
  const { orders } = useDashboard();
  const [query, setQuery] = useState("");
  const [drill, setDrill] = useState<string | null>(null);

  const all = useMemo(() => productStats(orders), [orders]);
  const categories = useMemo(() => groupBy(orders, "category"), [orders]);

  const filtered = useMemo(
    () =>
      all.filter(
        (p) =>
          (!drill || p.category === drill) &&
          (p.name.toLowerCase().includes(query.toLowerCase()) ||
            p.category.toLowerCase().includes(query.toLowerCase())),
      ),
    [all, query, drill],
  );

  const sort = useSort<ProductStat>(filtered, "revenue");
  const ranked = useMemo(() => [...all].filter((p) => p.orders >= 2), [all]);
  const top = ranked.slice(0, 5);
  const bottom = [...ranked].sort((a, b) => a.revenue - b.revenue).slice(0, 5);

  return (
    <AppShell
      title="Product Performance"
      description="Which products carry revenue, which are fading, and where the category mix sits."
    >
      <div className="space-y-5 p-4 md:p-6">
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Top performers */}
          <ChartCard
            title="Top performers"
            subtitle="Highest revenue products in range"
            action={<TrendingUp className="size-4 text-success" />}
          >
            <ul className="space-y-3">
              {top.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3 group">
                  <span
                    className="grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold text-white"
                    style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground num">
                      {p.units.toLocaleString()} units · {exact(p.avgPrice)} avg
                    </p>
                  </div>
                  <span className="text-sm font-semibold num">{currency(p.revenue)}</span>
                  <Delta value={p.growth} />
                </li>
              ))}
            </ul>
          </ChartCard>

          {/* Underperformers */}
          <ChartCard
            title="Underperformers"
            subtitle="Lowest revenue products worth reviewing"
            action={<TrendingDown className="size-4 text-destructive" />}
          >
            <ul className="space-y-3">
              {bottom.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-muted text-[11px] font-bold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground num">
                      {p.units.toLocaleString()} units · {exact(p.avgPrice)} avg
                    </p>
                  </div>
                  <span className="text-sm font-semibold num">{currency(p.revenue)}</span>
                  <Delta value={p.growth} />
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>

        {/* Category chart */}
        <ChartCard
          title="Category revenue breakdown"
          subtitle={drill ? `Filtered to ${drill} — click again to clear` : "Click a bar to drill into a category"}
          action={
            drill ? (
              <Button size="sm" variant="ghost" onClick={() => setDrill(null)}>
                Clear drill-down
              </Button>
            ) : null
          }
        >
          <div className="h-64 rounded-xl overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categories} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  {categories.map((_, i) => (
                    <linearGradient key={i} id={`cat${i}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.95} />
                      <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.65} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(v: number) => currency(v)}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={62}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  radius={[6, 6, 0, 0]}
                  onClick={(d: { name?: string }) =>
                    setDrill((cur) => (cur === d.name ? null : (d.name ?? null)))
                  }
                  className="cursor-pointer"
                >
                  {categories.map((c, i) => (
                    <Cell
                      key={c.name}
                      fill={`url(#cat${i})`}
                      fillOpacity={!drill || drill === c.name ? 1 : 0.25}
                      style={drill === c.name ? { filter: "drop-shadow(0 0 8px var(--chart-1))" } : undefined}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Product table */}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">All products</h3>
              <p className="text-xs text-muted-foreground num">
                {filtered.length} products · click any column header to sort
              </p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products or categories"
                className="pl-9"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <SortHeader<ProductStat> label="Product" field="name" sort={sort} />
                  <SortHeader<ProductStat> label="Category" field="category" sort={sort} />
                  <SortHeader<ProductStat> label="Units sold" field="units" sort={sort} align="right" />
                  <SortHeader<ProductStat> label="Revenue" field="revenue" sort={sort} align="right" />
                  <SortHeader<ProductStat> label="Avg price" field="avgPrice" sort={sort} align="right" />
                  <SortHeader<ProductStat> label="Growth" field="growth" sort={sort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sort.sorted.map((p) => (
                  <tr key={p.name} className="border-b border-border/60 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">{p.name}</td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right num">{p.units.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-right font-semibold num">{exact(p.revenue)}</td>
                    <td className="px-3 py-2.5 text-right num">{exact(p.avgPrice)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Delta value={p.growth} />
                    </td>
                  </tr>
                ))}
                {!sort.sorted.length ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No products match the current filters.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
