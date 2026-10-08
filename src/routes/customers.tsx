import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
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
import { Search } from "lucide-react";
import { AppShell } from "@/components/dash/app-shell";
import { CHART_COLORS, Card, ChartCard, ChartTooltip, KpiCard } from "@/components/dash/primitives";
import { SortHeader, useSort } from "@/components/dash/sortable";
import { useDashboard } from "@/lib/dashboard-store";
import {
  clvBuckets,
  currency,
  customerStats,
  exact,
  newVsReturning,
  type CustomerStat,
} from "@/lib/analytics";
import { Input } from "@/components/ui/input";
import { Users, UserPlus, Repeat, Crown } from "lucide-react";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customer Insights — DataPulse" },
      {
        name: "description",
        content:
          "New versus returning customers, lifetime value distribution and RFM segmentation for your buyers.",
      },
      { property: "og:title", content: "Customer Insights — DataPulse" },
      {
        property: "og:description",
        content: "Understand who buys, how often, and which customers are slipping away.",
      },
    ],
  }),
  component: CustomersPage,
});

const SEGMENT_NOTE: Record<string, string> = {
  Champions: "Recent, frequent, high spend",
  Loyal: "Recent and consistently valuable",
  Potential: "Recent buyers with room to grow",
  "New Customers": "First purchase, recent",
  "At Risk": "Valuable but gone quiet",
  Hibernating: "Long inactive, low value",
};

const SEGMENT_ICON: Record<string, string> = {
  Champions: "🏆",
  Loyal: "💎",
  Potential: "🌱",
  "New Customers": "✨",
  "At Risk": "⚠️",
  Hibernating: "💤",
};

function CustomersPage() {
  const { orders } = useDashboard();
  const [query, setQuery] = useState("");

  const stats = useMemo(() => customerStats(orders), [orders]);
  const split = useMemo(() => newVsReturning(orders), [orders]);
  const clv = useMemo(() => clvBuckets(orders), [orders]);

  const segments = useMemo(() => {
    const map = new Map<string, { name: string; customers: number; revenue: number }>();
    for (const c of stats) {
      let e = map.get(c.segment);
      if (!e) map.set(c.segment, (e = { name: c.segment, customers: 0, revenue: 0 }));
      e.customers += 1;
      e.revenue += c.revenue;
    }
    return Array.from(map.values())
      .map((s) => ({ ...s, revenue: Math.round(s.revenue) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [stats]);

  const filtered = useMemo(
    () =>
      stats.filter(
        (c) =>
          c.customer_name.toLowerCase().includes(query.toLowerCase()) ||
          c.customer_id.toLowerCase().includes(query.toLowerCase()) ||
          c.segment.toLowerCase().includes(query.toLowerCase()),
      ),
    [stats, query],
  );
  const sort = useSort<CustomerStat>(filtered, "revenue");
  const top10 = useMemo(() => [...stats].sort((a, b) => b.revenue - a.revenue).slice(0, 10), [stats]);

  const totalRevenue = stats.reduce((t, c) => t + c.revenue, 0);
  const returning = split[1]?.value ?? 0;
  const champions = segments.find((s) => s.name === "Champions")?.customers ?? 0;

  return (
    <AppShell
      title="Customer Insights"
      description="Retention, lifetime value and RFM-style segmentation across the filtered dataset."
    >
      <div className="space-y-5 p-4 md:p-6">
        {/* KPI row */}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Customers"
            value={stats.length.toLocaleString()}
            hint="in current selection"
            icon={<Users className="size-4" />}
          />
          <KpiCard
            label="Returning"
            value={`${returning.toLocaleString()} (${stats.length ? Math.round((returning / stats.length) * 100) : 0}%)`}
            hint="more than one order"
            icon={<Repeat className="size-4" />}
          />
          <KpiCard
            label="Average lifetime value"
            value={exact(stats.length ? totalRevenue / stats.length : 0)}
            hint="revenue per customer"
            icon={<UserPlus className="size-4" />}
          />
          <KpiCard
            label="Champions"
            value={champions.toLocaleString()}
            hint="best RFM segment"
            icon={<Crown className="size-4" />}
          />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* New vs returning donut */}
          <ChartCard title="New vs returning" subtitle="Customers by purchase frequency">
            <div className="h-64 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={split}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="82%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {split.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip money={false} />} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* CLV distribution */}
          <ChartCard title="Lifetime value distribution" subtitle="Customers per spend band">
            <div className="h-64 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clv} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="clvGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.60} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" strokeOpacity={0.5} vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <Tooltip content={<ChartTooltip money={false} />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                  <Bar dataKey="customers" name="Customers" radius={[6, 6, 0, 0]} fill="url(#clvGrad)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* RFM segments */}
        <ChartCard title="RFM segmentation" subtitle="Recency, frequency and monetary value">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {segments.map((s, i) => (
              <div
                key={s.name}
                className="rounded-xl border border-border p-4 transition-all duration-200 hover:-translate-y-0.5"
                style={{
                  borderLeft: `4px solid ${CHART_COLORS[i % CHART_COLORS.length]}`,
                  boxShadow: "var(--shadow-card)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card-hover)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.boxShadow = "var(--shadow-card)";
                }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{SEGMENT_ICON[s.name] ?? "•"}</span>
                    <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  </div>
                  <span
                    className="text-sm font-bold num rounded-full px-2.5 py-0.5"
                    style={{
                      background: `${CHART_COLORS[i % CHART_COLORS.length]}22`,
                      color: CHART_COLORS[i % CHART_COLORS.length],
                    }}
                  >
                    {s.customers}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">{SEGMENT_NOTE[s.name]}</p>
                <p className="mt-2.5 text-xs font-semibold num text-foreground">
                  {currency(s.revenue)} revenue ·{" "}
                  <span className="text-muted-foreground font-normal">
                    {totalRevenue ? Math.round((s.revenue / totalRevenue) * 100) : 0}%
                  </span>
                </p>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Top 10 customers chart */}
        <ChartCard title="Top 10 customers by spend" subtitle="Highest lifetime revenue in range">
          <div className="h-72 rounded-xl overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 16 }}>
                <defs>
                  <linearGradient id="custGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.65} />
                  </linearGradient>
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
                  dataKey="customer_name"
                  width={140}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} fill="url(#custGrad)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Customer table */}
        <Card className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">All customers</h3>
              <p className="text-xs text-muted-foreground num">{filtered.length} customers</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search customers or segments"
                className="pl-9"
              />
            </div>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b border-border">
                  <SortHeader<CustomerStat> label="Customer" field="customer_name" sort={sort} />
                  <SortHeader<CustomerStat> label="Segment" field="segment" sort={sort} />
                  <SortHeader<CustomerStat> label="Orders" field="orders" sort={sort} align="right" />
                  <SortHeader<CustomerStat> label="Revenue" field="revenue" sort={sort} align="right" />
                  <SortHeader<CustomerStat> label="AOV" field="aov" sort={sort} align="right" />
                  <SortHeader<CustomerStat> label="Days since order" field="recencyDays" sort={sort} align="right" />
                </tr>
              </thead>
              <tbody>
                {sort.sorted.map((c) => (
                  <tr key={c.customer_id} className="border-b border-border/60 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {c.customer_name}
                      <span className="ml-2 text-xs text-muted-foreground num">{c.customer_id}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {c.segment}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right num">{c.orders}</td>
                    <td className="px-3 py-2.5 text-right font-semibold num">{exact(c.revenue)}</td>
                    <td className="px-3 py-2.5 text-right num">{exact(c.aov)}</td>
                    <td className="px-3 py-2.5 text-right num">{c.recencyDays}</td>
                  </tr>
                ))}
                {!sort.sorted.length ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No customers match this search.
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
