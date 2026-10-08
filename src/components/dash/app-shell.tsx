import { Link } from "@tanstack/react-router";
import { Database, LineChart, Package, TrendingUp, Users } from "lucide-react";
import { type ReactNode } from "react";
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

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Floating Pill Navbar ── */}
      <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2">
        <header
          className="flex h-11 items-center gap-3 rounded-full border border-sidebar-border px-3 shadow-lg backdrop-blur-md"
          style={{
            background:
              "radial-gradient(ellipse 80% 120% at 50% -30%, oklch(0.38 0.14 185 / 0.18) 0%, transparent 70%), color-mix(in oklch, var(--color-sidebar) 90%, transparent)",
          }}
        >
          <TooltipProvider delayDuration={400}>
            {/* Logo — pulses — + static title */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="[animation:dp-pulse_2s_ease-in-out_infinite]">
                <DataPulseLogo size={24} />
              </span>
              <span className="text-sm font-semibold text-sidebar-accent-foreground whitespace-nowrap">
                DataPulse
              </span>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-sidebar-border shrink-0" />

            {/* Nav — icons only, tooltip on hover */}
            <nav className="flex items-center gap-0.5">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>
                    <Link
                      to={to}
                      activeOptions={{ exact: to === "/" }}
                      className="flex h-8 w-8 items-center justify-center transition-transform duration-150"
                      activeProps={{ className: "scale-125 text-sidebar-accent-foreground" }}
                      inactiveProps={{ className: "text-sidebar-foreground/50 hover:scale-110 hover:text-sidebar-foreground/80" }}
                    >
                      <Icon className="size-3.5 shrink-0" strokeWidth={2} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{label}</TooltipContent>
                </Tooltip>
              ))}
            </nav>

            {/* Divider */}
            <div className="h-4 w-px bg-sidebar-border shrink-0" />

            {/* Dataset */}
            <div className="flex items-center gap-1.5 shrink-0 pr-1">
              <Database className="size-3.5 text-sidebar-foreground/50 shrink-0" />
              <span className="text-xs text-sidebar-foreground/70 whitespace-nowrap">
                {sourceName || "No dataset"}
              </span>
              {allOrders.length > 0 && (
                <span className="inline-flex items-center rounded-full bg-sidebar-primary/15 px-2 py-0.5 text-[11px] font-medium num text-sidebar-primary/80">
                  {allOrders.length.toLocaleString()}
                </span>
              )}
            </div>
          </TooltipProvider>
        </header>
      </div>

      {/* Spacer so content doesn't hide under the pill */}
      <div className="h-20 shrink-0" />

      {/* ── Page header ── */}
      <div
        className="border-b border-border px-4 py-4 md:px-6"
        style={{
          background:
            "linear-gradient(to bottom, var(--color-card), color-mix(in oklch, var(--color-background) 85%, transparent))",
        }}
      >
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {hasData ? <FilterBar /> : null}

      <main className="flex-1">
        {loading ? <LoadingState /> : hasData ? children : <EmptyState />}
      </main>
    </div>
  );
}
