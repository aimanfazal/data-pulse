import type { Filters, Order, SegmentName } from "./types";

export const currency = (n: number) =>
  n >= 1_000_000
    ? `$${(n / 1_000_000).toFixed(2)}M`
    : n >= 10_000
      ? `$${(n / 1000).toFixed(1)}k`
      : `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const exact = (n: number) =>
  `$${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export const monthKey = (iso: string) => iso.slice(0, 7);

export const monthLabel = (key: string) => {
  const [y = "", m = "1"] = key.split("-");
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return `${names[Number(m) - 1] ?? m} ${y.slice(2)}`;
};

export function uniqueValues(orders: Order[], key: keyof Order): string[] {
  return Array.from(new Set(orders.map((o) => String(o[key])))).sort();
}

export function dateBounds(orders: Order[]) {
  if (!orders.length) return { min: "", max: "" };
  let min = orders[0]!.order_date;
  let max = orders[0]!.order_date;
  for (const o of orders) {
    if (o.order_date < min) min = o.order_date;
    if (o.order_date > max) max = o.order_date;
  }
  return { min, max };
}

/* ---------------- RFM segmentation ---------------- */

export interface CustomerStat {
  customer_id: string;
  customer_name: string;
  orders: number;
  revenue: number;
  aov: number;
  firstOrder: string;
  lastOrder: string;
  recencyDays: number;
  segment: SegmentName;
}

export function customerStats(orders: Order[], referenceDate?: string): CustomerStat[] {
  const ref = referenceDate ?? dateBounds(orders).max;
  const map = new Map<string, CustomerStat>();
  for (const o of orders) {
    let c = map.get(o.customer_id);
    if (!c) {
      c = {
        customer_id: o.customer_id,
        customer_name: o.customer_name,
        orders: 0,
        revenue: 0,
        aov: 0,
        firstOrder: o.order_date,
        lastOrder: o.order_date,
        recencyDays: 0,
        segment: "New Customers",
      };
      map.set(o.customer_id, c);
    }
    c.orders += 1;
    c.revenue += o.total_amount;
    if (o.order_date < c.firstOrder) c.firstOrder = o.order_date;
    if (o.order_date > c.lastOrder) c.lastOrder = o.order_date;
  }
  const list = Array.from(map.values());
  const day = 86400000;
  const refTime = ref ? new Date(ref).getTime() : Date.now();
  for (const c of list) {
    c.aov = c.revenue / c.orders;
    c.recencyDays = Math.max(0, Math.round((refTime - new Date(c.lastOrder).getTime()) / day));
  }
  const revs = [...list].sort((a, b) => a.revenue - b.revenue);
  const q = (arr: CustomerStat[], p: number, pick: (c: CustomerStat) => number) =>
    arr.length ? pick(arr[Math.min(arr.length - 1, Math.floor(arr.length * p))]!) : 0;
  const revHigh = q(revs, 0.66, (c) => c.revenue);
  const freqs = [...list].sort((a, b) => a.orders - b.orders);
  const freqHigh = q(freqs, 0.66, (c) => c.orders);
  const recs = [...list].sort((a, b) => a.recencyDays - b.recencyDays);
  const recFresh = q(recs, 0.4, (c) => c.recencyDays);
  const recStale = q(recs, 0.75, (c) => c.recencyDays);

  for (const c of list) {
    const isRecent = c.recencyDays <= recFresh;
    const isFrequent = c.orders >= freqHigh;
    const isValuable = c.revenue >= revHigh;
    const isNew = c.orders <= 1;
    if (isRecent && isFrequent && isValuable) c.segment = "Champions";
    else if (isRecent && (isFrequent || isValuable)) c.segment = "Loyal";
    else if (isRecent && isNew) c.segment = "New Customers";
    else if (isRecent) c.segment = "Potential";
    else if (c.recencyDays >= recStale && (isValuable || isFrequent)) c.segment = "At Risk";
    else if (c.recencyDays >= recStale) c.segment = "Hibernating";
    else c.segment = "Potential";
  }
  return list;
}

/* ---------------- Filtering ---------------- */

export function applyFilters(
  orders: Order[],
  filters: Filters,
  segmentByCustomer: Map<string, SegmentName>,
): Order[] {
  return orders.filter((o) => {
    if (filters.from && o.order_date < filters.from) return false;
    if (filters.to && o.order_date > filters.to) return false;
    if (filters.categories.length && !filters.categories.includes(o.category)) return false;
    if (filters.regions.length && !filters.regions.includes(o.region)) return false;
    if (filters.segments.length) {
      const seg = segmentByCustomer.get(o.customer_id);
      if (!seg || !filters.segments.includes(seg)) return false;
    }
    return true;
  });
}

/* ---------------- Aggregations ---------------- */

export const sum = (orders: Order[], pick: (o: Order) => number) =>
  orders.reduce((t, o) => t + pick(o), 0);

export function kpis(current: Order[], previous: Order[]) {
  const revenue = sum(current, (o) => o.total_amount);
  const prevRevenue = sum(previous, (o) => o.total_amount);
  const ordersCount = new Set(current.map((o) => o.order_id)).size;
  const prevOrders = new Set(previous.map((o) => o.order_id)).size;
  const customers = new Set(current.map((o) => o.customer_id)).size;
  const prevCustomers = new Set(previous.map((o) => o.customer_id)).size;
  const aov = ordersCount ? revenue / ordersCount : 0;
  const prevAov = prevOrders ? prevRevenue / prevOrders : 0;
  // No comparable prior period -> report flat rather than a misleading +100%.
  const g = (a: number, b: number) => (b > 0 ? ((a - b) / b) * 100 : 0);
  return {
    revenue,
    ordersCount,
    customers,
    aov,
    units: sum(current, (o) => o.quantity),
    revenueGrowth: g(revenue, prevRevenue),
    ordersGrowth: g(ordersCount, prevOrders),
    customersGrowth: g(customers, prevCustomers),
    aovGrowth: g(aov, prevAov),
  };
}

export function previousPeriod(orders: Order[], from: string, to: string): Order[] {
  if (!from || !to) return [];
  const day = 86400000;
  const span = new Date(to).getTime() - new Date(from).getTime() + day;
  const prevTo = new Date(new Date(from).getTime() - day).toISOString().slice(0, 10);
  const prevFrom = new Date(new Date(from).getTime() - span).toISOString().slice(0, 10);
  return orders.filter((o) => o.order_date >= prevFrom && o.order_date <= prevTo);
}

export function byMonth(orders: Order[]) {
  const map = new Map<string, { revenue: number; orders: Set<string>; units: number }>();
  for (const o of orders) {
    const k = monthKey(o.order_date);
    let e = map.get(k);
    if (!e) map.set(k, (e = { revenue: 0, orders: new Set(), units: 0 }));
    e.revenue += o.total_amount;
    e.orders.add(o.order_id);
    e.units += o.quantity;
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({
      key,
      label: monthLabel(key),
      revenue: Math.round(v.revenue),
      orders: v.orders.size,
      units: v.units,
    }));
}

export function byWeek(orders: Order[]) {
  const map = new Map<string, { revenue: number; orders: Set<string> }>();
  for (const o of orders) {
    const d = new Date(o.order_date);
    const dow = (d.getDay() + 6) % 7;
    const start = new Date(d.getTime() - dow * 86400000).toISOString().slice(0, 10);
    let e = map.get(start);
    if (!e) map.set(start, (e = { revenue: 0, orders: new Set() }));
    e.revenue += o.total_amount;
    e.orders.add(o.order_id);
  }
  return Array.from(map.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, v]) => ({
      key,
      label: key.slice(5),
      revenue: Math.round(v.revenue),
      orders: v.orders.size,
    }));
}

export function groupBy(orders: Order[], key: keyof Order) {
  const map = new Map<string, { name: string; revenue: number; units: number; orders: Set<string> }>();
  for (const o of orders) {
    const k = String(o[key]);
    let e = map.get(k);
    if (!e) map.set(k, (e = { name: k, revenue: 0, units: 0, orders: new Set() }));
    e.revenue += o.total_amount;
    e.units += o.quantity;
    e.orders.add(o.order_id);
  }
  return Array.from(map.values())
    .map((e) => ({
      name: e.name,
      revenue: Math.round(e.revenue),
      units: e.units,
      orders: e.orders.size,
      aov: e.orders.size ? Math.round(e.revenue / e.orders.size) : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export interface ProductStat {
  name: string;
  category: string;
  units: number;
  revenue: number;
  avgPrice: number;
  orders: number;
  growth: number;
}

export function productStats(orders: Order[]): ProductStat[] {
  const months = Array.from(new Set(orders.map((o) => monthKey(o.order_date)))).sort();
  const half = Math.floor(months.length / 2);
  const secondHalf = new Set(months.slice(half));
  const map = new Map<string, ProductStat & { recent: number; earlier: number }>();
  for (const o of orders) {
    let e = map.get(o.product_name);
    if (!e) {
      e = {
        name: o.product_name,
        category: o.category,
        units: 0,
        revenue: 0,
        avgPrice: 0,
        orders: 0,
        growth: 0,
        recent: 0,
        earlier: 0,
      };
      map.set(o.product_name, e);
    }
    e.units += o.quantity;
    e.revenue += o.total_amount;
    e.orders += 1;
    if (secondHalf.has(monthKey(o.order_date))) e.recent += o.total_amount;
    else e.earlier += o.total_amount;
  }
  return Array.from(map.values())
    .map((e) => ({
      name: e.name,
      category: e.category,
      units: e.units,
      revenue: Math.round(e.revenue),
      orders: e.orders,
      avgPrice: e.units ? Math.round((e.revenue / e.units) * 100) / 100 : 0,
      growth: e.earlier > 0 ? ((e.recent - e.earlier) / e.earlier) * 100 : e.recent > 0 ? 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue);
}

export function newVsReturning(orders: Order[]) {
  const stats = customerStats(orders);
  const returning = stats.filter((c) => c.orders > 1).length;
  return [
    { name: "New (1 order)", value: stats.length - returning },
    { name: "Returning", value: returning },
  ];
}

export function clvBuckets(orders: Order[]) {
  const stats = customerStats(orders);
  const buckets = [
    { name: "< $250", min: 0, max: 250 },
    { name: "$250–750", min: 250, max: 750 },
    { name: "$750–1.5k", min: 750, max: 1500 },
    { name: "$1.5k–3k", min: 1500, max: 3000 },
    { name: "$3k+", min: 3000, max: Infinity },
  ];
  return buckets.map((b) => ({
    name: b.name,
    customers: stats.filter((c) => c.revenue >= b.min && c.revenue < b.max).length,
  }));
}

export function dayOfWeekPerformance(orders: Order[]) {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const totals = new Array(7).fill(0);
  for (const o of orders) totals[new Date(o.order_date).getDay()]! += o.total_amount;
  const ordered = [1, 2, 3, 4, 5, 6, 0];
  return ordered.map((i) => ({ name: names[i]!, revenue: Math.round(totals[i]) }));
}

export function seasonality(orders: Order[]) {
  const names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const totals = new Array(12).fill(0);
  for (const o of orders) totals[new Date(o.order_date).getMonth()]! += o.total_amount;
  return names.map((name, i) => ({ name, revenue: Math.round(totals[i]) }));
}

export function generateInsights(orders: Order[]): string[] {
  if (orders.length < 5) return [];
  const out: string[] = [];
  const months = byMonth(orders);
  if (months.length >= 2) {
    const last = months[months.length - 1]!;
    const prev = months[months.length - 2]!;
    const change = prev.revenue ? ((last.revenue - prev.revenue) / prev.revenue) * 100 : 0;
    out.push(
      `Revenue ${change >= 0 ? "grew" : "declined"} ${Math.abs(change).toFixed(1)}% in ${last.label} versus ${prev.label} (${currency(last.revenue)} vs ${currency(prev.revenue)}).`,
    );
  }
  const cats = groupBy(orders, "category");
  if (cats.length && cats[0]) {
    const top = cats[0];
    const total = cats.reduce((t, c) => t + c.revenue, 0);
    out.push(
      `${top.name} is your largest category at ${currency(top.revenue)} — ${((top.revenue / total) * 100).toFixed(0)}% of all revenue.`,
    );
    if (cats.length > 1) {
      const weakest = cats[cats.length - 1]!;
      out.push(
        `${weakest.name} trails the pack at ${currency(weakest.revenue)}; a bundle or promo here is the clearest upside.`,
      );
    }
  }
  const regions = groupBy(orders, "region");
  if (regions.length) {
    const bestAov = [...regions].sort((a, b) => b.aov - a.aov)[0]!;
    out.push(
      `${bestAov.name} has the highest average order value at ${exact(bestAov.aov)} across ${bestAov.orders} orders.`,
    );
  }
  const prods = productStats(orders).filter((p) => p.orders >= 3);
  const riser = [...prods].sort((a, b) => b.growth - a.growth)[0];
  if (riser && riser.growth > 0)
    out.push(
      `${riser.name} is accelerating fastest, up ${riser.growth.toFixed(0)}% in the most recent half of the period.`,
    );
  const faller = [...prods].sort((a, b) => a.growth - b.growth)[0];
  if (faller && faller.growth < 0)
    out.push(
      `${faller.name} is losing momentum, down ${Math.abs(faller.growth).toFixed(0)}% — review pricing or stock levels.`,
    );
  const stats = customerStats(orders);
  const champions = stats.filter((c) => c.segment === "Champions");
  const atRisk = stats.filter((c) => c.segment === "At Risk");
  if (champions.length) {
    const champRev = champions.reduce((t, c) => t + c.revenue, 0);
    const totalRev = stats.reduce((t, c) => t + c.revenue, 0);
    out.push(
      `${champions.length} "Champions" drive ${((champRev / totalRev) * 100).toFixed(0)}% of revenue — worth a loyalty perk.`,
    );
  }
  if (atRisk.length)
    out.push(
      `${atRisk.length} high-value customers are "At Risk" with no recent orders — a win-back campaign could recover ${currency(atRisk.reduce((t, c) => t + c.aov, 0))}.`,
    );
  const pay = groupBy(orders, "payment_method");
  if (pay[0])
    out.push(
      `${pay[0]!.name} accounts for the largest share of checkout volume (${pay[0]!.orders} orders).`,
    );
  const dow = dayOfWeekPerformance(orders).sort((a, b) => b.revenue - a.revenue)[0];
  if (dow) out.push(`${dow.name} is the strongest trading day of the week by revenue.`);
  return out;
}
