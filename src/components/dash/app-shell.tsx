import { Link } from "@tanstack/react-router";
import { BarChart3, LineChart, Package, TrendingUp, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useDashboard } from "@/lib/dashboard-store";
import { FilterBar } from "./filter-bar";
import { EmptyState, LoadingState } from "./empty-state";

const NAV = [
  { to: "/", label: "Overview", icon: LineChart },
  { to: "/products", label: "Product Performance", icon: Package },
  { to: "/customers", label: "Customer Insights", icon: Users },
  { to: "/trends", label: "Trends & Growth", icon: TrendingUp },
] as const;

export function AppShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { hasData, loading, sourceName, allOrders } = useDashboard();

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Sidebar ── */}
      <aside
        className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border px-3 py-5 text-sidebar-foreground md:flex"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 110% -10%, oklch(0.38 0.14 265 / 0.18) 0%, transparent 70%), var(--color-sidebar)",
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 pb-1">
          <span
            className="grid size-9 shrink-0 place-items-center rounded-xl shadow-lg ring-2 ring-sidebar-primary/40 text-white"
            style={{ backgroundImage: "var(--gradient-hero)" }}
          >
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-sidebar-accent-foreground leading-tight">Commerce IQ</p>
            <p className="text-[11px] text-sidebar-foreground/60 leading-tight">Sales analytics</p>
          </div>
        </div>

        {/* Divider accent */}
        <div className="mx-2 mt-4 mb-2 h-px bg-gradient-to-r from-sidebar-primary/60 via-sidebar-primary/20 to-transparent" />

        {/* Nav */}
        <nav className="mt-1 flex flex-1 flex-col gap-0.5">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/80 transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:translate-x-0.5"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary pl-[10px]",
              }}
            >
              <Icon className="size-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Dataset widget */}
        <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/75">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-primary/90">Dataset</p>
          <p className="mt-1.5 truncate font-medium text-sidebar-accent-foreground">
            {sourceName || "None loaded"}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-[11px] font-medium num text-sidebar-primary/90">
            {allOrders.length.toLocaleString()} rows
          </span>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Page header */}
        <header
          className="border-b border-border bg-card px-4 py-4 md:px-6"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-card), color-mix(in oklch, var(--color-background) 85%, transparent))",
          }}
        >
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          {/* Mobile nav */}
          <nav className="mt-3 flex gap-1.5 overflow-x-auto md:hidden">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors"
                activeProps={{ className: "bg-primary text-primary-foreground border-primary font-medium" }}
              >
                {label}
              </Link>
            ))}
          </nav>
        </header>

        {hasData ? <FilterBar /> : null}

        <main className="flex-1">
          {loading ? <LoadingState /> : hasData ? children : <EmptyState />}
        </main>
      </div>
    </div>
  );
}
