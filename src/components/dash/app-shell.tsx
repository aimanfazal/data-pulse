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
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col bg-sidebar px-3 py-5 text-sidebar-foreground md:flex">
        <div className="flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <BarChart3 className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-sidebar-accent-foreground">Commerce IQ</p>
            <p className="text-[11px] text-sidebar-foreground/70">Sales analytics</p>
          </div>
        </div>

        <nav className="mt-7 flex flex-1 flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/85 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              activeProps={{
                className:
                  "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-inner",
              }}
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="rounded-xl border border-sidebar-border p-3 text-xs text-sidebar-foreground/75">
          <p className="font-medium text-sidebar-accent-foreground">Dataset</p>
          <p className="mt-1 truncate">{sourceName || "None loaded"}</p>
          <p className="num">{allOrders.length.toLocaleString()} rows</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-card px-4 py-4 md:px-6">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
          <nav className="mt-3 flex gap-1 overflow-x-auto md:hidden">
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="whitespace-nowrap rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                activeProps={{ className: "bg-primary text-primary-foreground border-primary" }}
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
