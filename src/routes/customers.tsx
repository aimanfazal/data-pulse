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
      { title: "Customer Insights — Commerce IQ" },
      {
        name: "description",
        content:
          "New versus returning customers, lifetime value distribution and RFM segmentation for your buyers.",
      },
      { property: "og:title", content: "Customer Insights — Commerce IQ" },
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
          <ChartCard title="New vs returning" subtitle="Customers by purchase frequency">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={split}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="var(--card)"
                  >
                    {split.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip money={false} />} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Lifetime value distribution" subtitle="Customers per spend band">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={clv} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
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
                  <Tooltip content={<ChartTooltip money={false} />} cursor={{ fill: "var(--muted)" }} />
                  <Bar dataKey="customers" name="Customers" radius={[6, 6, 0, 0]} fill="var(--chart-2)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="RFM segmentation" subtitle="Recency, frequency and monetary value">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {segments.map((s, i) => (
              <div
                key={s.name}
                className="rounded-xl border border-border p-4"
                style={{ borderLeft: `4px solid ${CHART_COLORS[i % CHART_COLORS.length]}` }}
              >
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-semibold text-foreground">{s.name}</p>
                  <span className="text-sm font-medium num">{s.customers}</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{SEGMENT_NOTE[s.name]}</p>
                <p className="mt-2 text-xs font-medium num text-foreground">
                  {currency(s.revenue)} revenue ·{" "}
                  {totalRevenue ? Math.round((s.revenue / totalRevenue) * 100) : 0}%
                </p>
              </div>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Top 10 customers by spend" subtitle="Highest lifetime revenue in range">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
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
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="revenue" name="Revenue" radius={[0, 6, 6, 0]} fill="var(--chart-1)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

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
                  <tr key={c.customer_id} className="border-b border-border/60 hover:bg-muted/50">
                    <td className="px-3 py-2.5 font-medium text-foreground">
                      {c.customer_name}
                      <span className="ml-2 text-xs text-muted-foreground num">{c.customer_id}</span>
                    </td>
                    <td className="px-3 py-2.5 text-muted-foreground">{c.segment}</td>
                    <td className="px-3 py-2.5 text-right num">{c.orders}</td>
                    <td className="px-3 py-2.5 text-right font-medium num">{exact(c.revenue)}</td>
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
