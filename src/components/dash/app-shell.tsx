import { Link } from "@tanstack/react-router";
import { Database, LineChart, Package, TrendingUp, Users } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useDashboard } from "@/lib/dashboard-store";
import { FilterBar } from "./filter-bar";
import { EmptyState, LoadingState } from "./empty-state";
import { DataPulseLogo } from "./logo";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex min-h-screen bg-background">
      {/* ── Icon Rail ── */}
      <aside
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-sidebar-border py-5 text-sidebar-foreground md:flex overflow-hidden transition-all duration-200"
        style={{
          width: expanded ? "200px" : "56px",
          background:
            "radial-gradient(ellipse 80% 50% at 110% -10%, oklch(0.38 0.14 185 / 0.18) 0%, transparent 70%), var(--color-sidebar)",
        }}
      >
        <TooltipProvider delayDuration={0}>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3 pb-1 min-w-0">
            <span className="shrink-0">
              <DataPulseLogo />
            </span>
            <div
              className="min-w-0 overflow-hidden transition-all duration-200"
              style={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }}
            >
              <p className="text-sm font-semibold text-sidebar-accent-foreground leading-tight whitespace-nowrap">DataPulse</p>
              <p className="text-[11px] text-sidebar-foreground/60 leading-tight whitespace-nowrap">Analytics Platform</p>
            </div>
          </div>

          {/* Divider accent */}
          <div className="mx-3 mt-4 mb-2 h-px bg-gradient-to-r from-sidebar-primary/60 via-sidebar-primary/20 to-transparent" />

          {/* Nav */}
          <nav className="mt-1 flex flex-1 flex-col gap-0.5 px-2">
            {NAV.map(({ to, label, icon: Icon }) => (
              <Tooltip key={to}>
                <TooltipTrigger asChild>
                  <Link
                    to={to}
                    activeOptions={{ exact: to === "/" }}
                    className="group flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm text-sidebar-foreground/80 transition-all duration-150 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground min-w-0"
                    activeProps={{
                      className:
                        "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary pl-[9px]",
                    }}
                  >
                    <Icon className="size-4 shrink-0 transition-transform duration-150 group-hover:scale-110" />
                    <span
                      className="overflow-hidden whitespace-nowrap transition-all duration-200"
                      style={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0, maxWidth: expanded ? "160px" : 0 }}
                    >
                      {label}
                    </span>
                  </Link>
                </TooltipTrigger>
                {!expanded && (
                  <TooltipContent side="right">{label}</TooltipContent>
                )}
              </Tooltip>
            ))}
          </nav>

          {/* Dataset widget */}
          <div className="mx-2 overflow-hidden">
            {expanded ? (
              <div className="rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-3 text-xs text-sidebar-foreground/75 transition-all duration-200">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sidebar-primary/90">Dataset</p>
                <p className="mt-1.5 truncate font-medium text-sidebar-accent-foreground">
                  {sourceName || "None loaded"}
                </p>
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-sidebar-primary/20 px-2 py-0.5 text-[11px] font-medium num text-sidebar-primary/90">
                  {allOrders.length.toLocaleString()} rows
                </span>
              </div>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex justify-center rounded-lg p-2.5 text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground cursor-default transition-colors">
                    <Database className="size-4 shrink-0" />
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {sourceName || "No dataset"} · {allOrders.length.toLocaleString()} rows
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
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
