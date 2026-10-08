import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Lightbulb } from "lucide-react";
import { AppShell } from "@/components/dash/app-shell";
import { CHART_COLORS, ChartCard, ChartTooltip, Delta } from "@/components/dash/primitives";
import { useDashboard } from "@/lib/dashboard-store";
import {
  applyFilters,
  byMonth,
  currency,
  dayOfWeekPerformance,
  generateInsights,
  groupBy,
  monthLabel,
  seasonality,
} from "@/lib/analytics";

export const Route = createFileRoute("/trends")({
  head: () => ({
    meta: [
      { title: "Trends & Growth — DataPulse" },
      {
        name: "description",
        content:
          "Month-over-month and year-over-year growth, seasonality, payment mix and automatic insights.",
      },
      { property: "og:title", content: "Trends & Growth — DataPulse" },
      {
        property: "og:description",
        content: "Find the seasons, channels and categories driving your growth.",
      },
    ],
  }),
  component: TrendsPage,
});

function TrendsPage() {
  const { orders, allOrders, filters, segmentByCustomer } = useDashboard();

  const monthly = useMemo(() => {
    const rows = byMonth(orders);
    return rows.map((r, i) => ({
      ...r,
      mom: i === 0 || !rows[i - 1]!.revenue
          ? 0
          : ((r.revenue - rows[i - 1]!.revenue) / rows[i - 1]!.revenue) * 100,
    }));
  }, [orders]);

  const yoy = useMemo(() => {
    const undated = applyFilters(
      allOrders,
      { ...filters, from: "", to: "" },
      segmentByCustomer,
    );
    const all = byMonth(undated);
    const lookup = new Map(all.map((m) => [m.key, m.revenue]));
    return all
      .filter((m) => m.key >= (filters.from || "").slice(0, 7))
      .map((m) => {
        const [y, mm] = m.key.split("-");
        const prevKey = `${Number(y) - 1}-${mm}`;
        const prior = lookup.get(prevKey) ?? 0;
        return {
          label: m.label,
          current: m.revenue,
          priorYear: prior,
          growth: prior ? ((m.revenue - prior) / prior) * 100 : 0,
        };
      });
  }, [allOrders, filters, segmentByCustomer]);

  const season = useMemo(() => seasonality(orders), [orders]);
  const dow = useMemo(() => dayOfWeekPerformance(orders), [orders]);
  const payments = useMemo(() => groupBy(orders, "payment_method"), [orders]);
  const insights = useMemo(() => generateInsights(orders), [orders]);

  const bestMonth = [...season].sort((a, b) => b.revenue - a.revenue)[0];

  return (
    <AppShell
      title="Trends & Growth Opportunities"
      description="Growth comparisons, seasonal patterns and automatically generated observations."
    >
      <div className="space-y-5 p-4 md:p-6">
        {/* Auto insights */}
        <ChartCard
          title="Automatic insights"
          subtitle="Generated from the data currently in view"
          action={<Lightbulb className="size-4 text-chart-3" />}
        >
          {insights.length ? (
            <ul className="grid gap-3 md:grid-cols-2">
              {insights.map((text, i) => (
                <li
                  key={i}
                  className="rounded-xl bg-muted/50 p-3.5 text-sm leading-relaxed text-foreground border-l-4"
                  style={{ borderLeftColor: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {text}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Not enough data in this selection to generate insights.
            </p>
          )}
        </ChartCard>

        {/* MoM chart */}
        <ChartCard
          title="Month-over-month growth"
          subtitle="Revenue bars with growth rate overlay"
        >
          <div className="h-72 rounded-xl overflow-hidden">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthly} margin={{ left: 4, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="momGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.65} />
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
                  yAxisId="left"
                  tickFormatter={(v: number) => currency(v)}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={62}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={(v: number) => `${v.toFixed(0)}%`}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  tickLine={false}
                  axisLine={false}
                  width={48}
                />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  yAxisId="left"
                  dataKey="revenue"
                  name="Revenue"
                  radius={[6, 6, 0, 0]}
                  fill="url(#momGrad)"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="mom"
                  name="MoM %"
                  stroke="var(--chart-3)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "var(--chart-3)" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* YoY chart */}
          <ChartCard
            title="Year-over-year comparison"
            subtitle="Each month against the same month last year"
          >
            {yoy.some((y) => y.priorYear > 0) ? (
              <div className="h-64 rounded-xl overflow-hidden">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yoy} margin={{ left: 4, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="yoyPrior" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.90} />
                        <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0.55} />
                      </linearGradient>
                      <linearGradient id="yoyCurrent" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.65} />
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
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="priorYear" name="Prior year" radius={[6, 6, 0, 0]} fill="url(#yoyPrior)" />
                    <Bar dataKey="current" name="Current" radius={[6, 6, 0, 0]} fill="url(#yoyCurrent)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="grid h-64 place-items-center rounded-xl bg-muted/50 px-6 text-center text-sm text-muted-foreground">
                This dataset covers less than two years, so there is no prior-year period to
                compare against yet.
              </div>
            )}
          </ChartCard>

          {/* Payment method donut */}
          <ChartCard
            title="Payment method breakdown"
            subtitle="Revenue share by checkout method"
          >
            <div className="h-64 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={payments}
                    dataKey="revenue"
                    nameKey="name"
                    innerRadius="52%"
                    outerRadius="80%"
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {payments.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Seasonality */}
          <ChartCard
            title="Seasonality by month"
            {...(bestMonth ? { subtitle: `${bestMonth.name} is the strongest month overall` } : {})}
          >
            <div className="h-64 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={season} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="seasonBase" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.90} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.55} />
                    </linearGradient>
                    <linearGradient id="seasonBest" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0.70} />
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
                    tickFormatter={(v: number) => currency(v)}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={62}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                  <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]}>
                    {season.map((s, i) => (
                      <Cell
                        key={i}
                        fill={s.name === bestMonth?.name ? "url(#seasonBest)" : "url(#seasonBase)"}
                        style={
                          s.name === bestMonth?.name
                            ? { filter: "drop-shadow(0 0 6px var(--chart-2))" }
                            : undefined
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          {/* Day of week */}
          <ChartCard title="Revenue by day of week" subtitle="Where trading peaks">
            <div className="h-64 rounded-xl overflow-hidden">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dow} margin={{ left: 4, right: 8, top: 8 }}>
                  <defs>
                    <linearGradient id="dowGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-6)" stopOpacity={0.95} />
                      <stop offset="100%" stopColor="var(--chart-6)" stopOpacity={0.60} />
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
                    tickFormatter={(v: number) => currency(v)}
                    tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    tickLine={false}
                    axisLine={false}
                    width={62}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                  <Bar dataKey="revenue" name="Revenue" radius={[6, 6, 0, 0]} fill="url(#dowGrad)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </div>

        {/* Monthly detail table */}
        <ChartCard title="Monthly detail" subtitle="Revenue, orders and month-over-month change">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Month</th>
                  <th className="py-2 pr-3 text-right font-medium">Revenue</th>
                  <th className="py-2 pr-3 text-right font-medium">Orders</th>
                  <th className="py-2 pr-3 text-right font-medium">Units</th>
                  <th className="py-2 text-right font-medium">MoM</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((m) => (
                  <tr key={m.key} className="border-b border-border/60 last:border-0 hover:bg-muted/40 transition-colors">
                    <td className="py-2.5 pr-3 font-medium">{monthLabel(m.key)}</td>
                    <td className="py-2.5 pr-3 text-right num">{currency(m.revenue)}</td>
                    <td className="py-2.5 pr-3 text-right num">{m.orders}</td>
                    <td className="py-2.5 pr-3 text-right num">{m.units}</td>
                    <td className="py-2.5 text-right">
                      <Delta value={m.mom} />
                    </td>
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
