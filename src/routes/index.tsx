import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { DollarSign, Package, ShoppingCart, Users } from "lucide-react";
import { AppShell } from "@/components/dash/app-shell";
import {
  CHART_COLORS,
  ChartCard,
  ChartTooltip,
  KpiCard,
} from "@/components/dash/primitives";
import { useDashboard } from "@/lib/dashboard-store";
import {
  byMonth,
  byWeek,
  currency,
  exact,
  groupBy,
  kpis,
  productStats,
} from "@/lib/analytics";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview — DataPulse Sales Analytics" },
      {
        name: "description",
        content:
          "Track revenue, orders, average order value and regional performance across your e-commerce sales data.",
      },
      { property: "og:title", content: "Overview — DataPulse Sales Analytics" },
      {
        property: "og:description",
        content: "Revenue trends, category mix and top products in one live dashboard.",
      },
    ],
  }),
  component: OverviewPage,
});

function OverviewPage() {
  const { orders, previousOrders } = useDashboard();
  const [grain, setGrain] = useState<"month" | "week">("month");

  const k = useMemo(() => kpis(orders, previousOrders), [orders, previousOrders]);
  const trend = useMemo(
    () => (grain === "month" ? byMonth(orders) : byWeek(orders)),
    [orders, grain],
  );
  const categories = useMemo(() => groupBy(orders, "category"), [orders]);
  const regions = useMemo(() => groupBy(orders, "region"), [orders]);
  const topProducts = useMemo(() => productStats(orders).slice(0, 5), [orders]);

  return (
    <AppShell
      title="Overview Dashboard"
      description="Headline performance for the selected period, compared with the preceding one."
    >
      <div className="space-y-5 p-4 md:p-6">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Total revenue"
            value={currency(k.revenue)}
            delta={k.revenueGrowth}
            icon={<DollarSign className="size-4" />}
          />
          <KpiCard
            label="Total orders"
            value={k.ordersCount.toLocaleString()}
            delta={k.ordersGrowth}
            icon={<ShoppingCart className="size-4" />}
          />
          <KpiCard
            label="Average order value"
            value={exact(k.aov)}
            delta={k.aovGrowth}
            icon={<Package className="size-4" />}
          />
          <KpiCard
            label="Total customers"
            value={k.customers.toLocaleString()}
            delta={k.customersGrowth}
            icon={<Users className="size-4" />}
          />
        </div>

        {/* Revenue trend */}
        <ChartCard
          title="Revenue trend"
          subtitle={`${k.units.toLocaleString()} units sold across the selected range`}
          action={
            <div className="flex gap-1 rounded-lg border border-border p-0.5">
              {(["month", "week"] as const).map((g) => (
                <Button
                  key={g}
                  size="sm"
                  variant={grain === g ? "secondary" : "ghost"}
                  className="h-7 px-3 text-xs capitalize"
                  onClick={() => setGrain(g)}
                >
                  {g}ly
                </Button>
              ))}
            </div>
          }
        >
          <div className="h-72 rounded-xl overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                    <stop offset="60%" stopColor="var(--chart-1)" stopOpacity={0.12} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                <XAxis
                  dataKey="label"
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
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Revenue"
                  stroke="var(--chart-1)"
                  strokeWidth={2.5}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Category donut */}
          <ChartCard title="Revenue by category" subtitle="Share of total revenue">
            <div className="h-72 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categories}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="82%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {categories.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Regional bar chart */}
          <ChartCard title="Sales by region" subtitle="Revenue and average order value">
            <div className="h-72 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={regions} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <defs>
                    {regions.map((_, i) => (
                      <linearGradient key={i} id={`rgn${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.9} />
                        <stop offset="100%" stopColor={CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.65} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(v: number) => currency(v)}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                  <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]}>
                    {regions.map((_, i) => (
                      <Cell key={i} fill={`url(#rgn${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Top products table */}
        <ChartCard title="Top 5 best-selling products" subtitle="Ranked by revenue in range">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Product</th>
                  <th className="py-2 pr-3 font-medium">Category</th>
                  <th className="py-2 pr-3 text-right font-medium">Units</th>
                  <th className="py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.name} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-3">
                      <span
                        className="inline-grid size-6 place-items-center rounded-full text-[11px] font-bold text-white"
                        style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 font-medium text-foreground">{p.name}</td>
                    <td className="py-2.5 pr-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right num">{p.units.toLocaleString()}</td>
                    <td className="py-2.5 text-right font-semibold num">{exact(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </AppShell>
  );
}
