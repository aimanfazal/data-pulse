# UI/UX Visual Improvements Plan — DataPulse

## Top-Level Overview

The dashboard is functionally solid but visually flat. Cards have minimal depth, charts
are unstyled plain Recharts defaults, the sidebar lacks personality, and the overall colour
palette is muted with no focal points. The goal is to make the app feel polished and
premium without adding new features or breaking existing logic. Every change is purely
presentational — no analytics logic, routing, or state management is touched.

All work is scoped to:
- `src/styles.css` — design tokens & global utilities
- `src/components/dash/primitives.tsx` — KpiCard, ChartCard, Delta, ChartTooltip
- `src/components/dash/app-shell.tsx` — sidebar & page header
- `src/components/dash/filter-bar.tsx` — filter toolbar
- `src/components/dash/empty-state.tsx` — empty / loading states
- `src/routes/index.tsx` — overview page layout & charts
- `src/routes/products.tsx` — products page layout & charts
- `src/routes/customers.tsx` — customers page layout & charts
- `src/routes/trends.tsx` — trends page layout & charts

No new dependencies are required (all animation, gradient, and shadow utilities already
exist via Tailwind v4 + tw-animate-css).

---

## Sub-Tasks

---

### Sub-Task 1 — Design Token Refresh (Foundation)

**Status:** `[ ] pending`

**Intent**
Upgrade the design token layer in `styles.css` so every subsequent change looks
cohesive. Richer shadows, a glass-morphism card surface, a subtle hero gradient,
and a more vibrant primary palette establish the visual foundation everything else
builds on.

**Expected Outcomes**
- Cards have a visible lift (multi-layer box-shadow) and very slightly frosted feel.
- Primary colour is noticeably richer / more saturated.
- A new `@utility glass-surface` class is available for overlay panels.
- The `card-surface` utility gains the upgraded shadow and a faint inner highlight.
- Dark-mode counterparts are updated so contrast ratios remain acceptable.
- `--gradient-hero` becomes a more vibrant multi-stop gradient used in the sidebar logo and empty-state icon.
- A `--gradient-card-shine` token is added for optional card shimmer.

**Todo List**
- [ ] Increase `--primary` lightness/chroma for a bolder blue.
- [ ] Rewrite `--shadow-card` to a three-layer shadow (ambient + mid + key).
- [ ] Add `--shadow-card-hover` for interactive card lift.
- [ ] Upgrade `--gradient-hero` to a three-stop gradient (indigo → teal → cyan).
- [ ] Add `--gradient-card-shine` as a subtle diagonal light-streak token.
- [ ] Add `@utility glass-surface` (backdrop-blur + semi-transparent bg + border).
- [ ] Update `card-surface` utility to use new shadow and add top inner highlight via box-shadow inset.
- [ ] Verify dark-mode tokens still produce accessible foreground contrast.

**Relevant Context**
- `src/styles.css` `:root`, `.dark`, `@theme inline`, `@utility card-surface`
- The `--gradient-hero` token is already used in `empty-state.tsx:47` and `app-shell.tsx` sidebar logo area.

---

### Sub-Task 2 — Sidebar & App Shell Polish

**Status:** `[ ] pending`

**Intent**
The sidebar is a solid dark bar but has no visual interest. Adding a gradient overlay,
icon badge glow on the logo, active-link pill animation, and a richer dataset widget
turns it into a strong visual anchor. The mobile header also needs a top border accent.

**Expected Outcomes**
- Sidebar background uses a very subtle radial gradient overlay (top-right glow).
- The logo badge uses `--gradient-hero` and glows softly with a ring shadow.
- Active nav link has a left border accent bar in addition to the background fill.
- Nav links get a smooth `transition-all` on hover (slight left indent + colour).
- The dataset info widget at the bottom has a bolder border and tiny badge style.
- The desktop sidebar and mobile header both show a 1 px top accent border
  (`--sidebar-primary` colour) beneath the logo.
- Page `<header>` (title bar) gets a faint gradient background, not plain `bg-card`.

**Todo List**
- [ ] Add radial gradient to `<aside>` background using an inline style or Tailwind arbitrary value.
- [ ] Wrap logo icon span with glow ring (`ring-2 ring-sidebar-primary/40 shadow-lg`).
- [ ] Add `border-l-2 border-sidebar-primary` to the `activeProps` className of nav links.
- [ ] Add `transition-all duration-150` and hover `translate-x-0.5` to nav link base class.
- [ ] Upgrade dataset widget: bold source name, coloured row count badge.
- [ ] Add a 2 px top bar (`border-t-2 border-sidebar-primary`) to the `<aside>` top.
- [ ] Replace `bg-card` on page `<header>` with a very faint gradient (`bg-gradient-to-b from-card to-background/80`).

**Relevant Context**
- `src/components/dash/app-shell.tsx` — `<aside>`, `<nav>`, `<header>`, dataset widget (line 57–61)
- Active link classes are at line 46–49.

---

### Sub-Task 3 — KPI Cards & Primitives Visual Upgrade

**Status:** `[ ] pending`

**Intent**
KPI cards are the most-viewed element in the app. Adding icon badge gradients, a
coloured top-border accent, hover lift, and a bolder delta badge makes the metric
story land immediately. The `ChartCard` also gets a header divider and subtle
background distinction.

**Expected Outcomes**
- Each `KpiCard` icon badge uses a per-card gradient accent instead of plain `bg-accent`.
- A 3 px top border in the card's accent colour appears on each `KpiCard`.
- Cards lift on hover (`hover:shadow-card-hover hover:-translate-y-0.5 transition-all`).
- `Delta` badge is slightly larger with a bolder icon and readable contrast.
- `ChartCard` header area has a bottom separator line and slightly distinct background.
- `ChartTooltip` gets a blurred glass background and a coloured left accent bar per row.
- `SectionTitle` `<h2>` gains a coloured left-border accent.

**Todo List**
- [ ] Add `group` and hover lift classes to `KpiCard`'s outer `<Card>`.
- [ ] Replace `bg-accent` on the icon span with `style={{ background: "var(--gradient-hero)" }}` + white icon colour.
- [ ] Add a `border-t-[3px] border-primary/70` to `KpiCard`'s `<Card>` className.
- [ ] Increase `Delta` pill padding slightly (`px-2.5 py-1`) and icon size to `size-3.5`.
- [ ] Add `border-b border-border` divider inside `ChartCard` between header and content.
- [ ] Give `ChartCard` a `bg-card/80` base to distinguish from page background.
- [ ] Rewrite `ChartTooltip` to use `glass-surface` utility + coloured left stripe per entry.
- [ ] Add `border-l-4 border-primary pl-3` accent to `SectionTitle` `<h2>`.

**Relevant Context**
- `src/components/dash/primitives.tsx` — all components are here.
- `src/components/dash/sortable.tsx` — `SortHeader` `<th>` can get `hover:text-foreground transition-colors`.

---

### Sub-Task 4 — Filter Bar & Controls Polish

**Status:** `[ ] pending`

**Intent**
The filter bar is functional but looks like a plain toolbar. Using the glass-surface
utility, adding a coloured active-filter count badge, and improving the date input
area makes the bar feel intentional and polished.

**Expected Outcomes**
- The filter bar wrapper uses `glass-surface` so it appears lightly frosted above the page.
- The date range widget has a primary-coloured `CalendarRange` icon.
- Active filter badges are primary-coloured with a glow ring.
- The "rows in view" counter is hidden when zero filters are active (no visual noise).
- Reset button only appears when at least one filter is non-default (already tracked
  through `filters`), and gains a subtle destructive colour.
- Export button uses `--gradient-hero` as background for a premium feel.

**Todo List**
- [ ] Replace outer `div` classes with `glass-surface` utility + keep existing padding/gap.
- [ ] Colour the `CalendarRange` icon with `text-primary` instead of `text-muted-foreground`.
- [ ] Update `MultiSelect` badge to use `bg-primary text-primary-foreground` with a `ring-1 ring-primary/30`.
- [ ] Style the Export `<Button>` with an inline gradient background + white text.
- [ ] Add `text-primary` to the "rows in view" counter for emphasis.
- [ ] Give the Reset `Button` a `text-destructive hover:text-destructive` treatment.

**Relevant Context**
- `src/components/dash/filter-bar.tsx` — `FilterBar`, `MultiSelect` components.
- `src/styles.css` — `glass-surface` utility (added in Sub-Task 1).

---

### Sub-Task 5 — Chart Visual Upgrades (All Pages)

**Status:** `[ ] pending`

**Intent**
Recharts charts use plain fills and thin strokes. Applying gradient fills to area/bar
charts, rounding chart containers, using named chart colours consistently, and fixing
the tooltip/legend typography makes every chart look deliberately designed.

**Expected Outcomes**
- Overview area chart: gradient fill is more opaque and vivid at the top stop.
- All bar charts: bars use a multi-stop vertical gradient fill via `<defs>` + `url(#...)`.
- Donut/Pie charts: `stroke` is removed from cells (creates ugly white border between slices on dark mode).
- Legends use `iconType="circle"` consistently and have `14px` font + `gap-2` spacing.
- `CartesianGrid` uses `opacity-30` equivalent (`stroke="var(--border)" strokeOpacity={0.5}`).
- Chart containers gain `rounded-xl overflow-hidden` so charts clip to the card radius.
- Top-5 products table on the overview page: rank badge becomes a small coloured circle.

**Todo List**
- [ ] In `index.tsx`: increase area chart gradient `stopOpacity` at 0% from 0.35 → 0.55.
- [ ] In `index.tsx`: add `<defs>` gradient for the regional bar chart and replace `fill` with `url()`.
- [ ] In `index.tsx`: remove `stroke="var(--card)"` from Pie cells; add `strokeWidth={0}`.
- [ ] In `products.tsx`: add vertical bar gradient for category breakdown chart.
- [ ] In `products.tsx`: highlight the active drill-down bar with a glow `filter` CSS effect.
- [ ] In `customers.tsx`: remove Pie stroke; give CLV bar chart a gradient fill.
- [ ] In `customers.tsx`: style RFM segment cards — add a coloured dot/emoji icon per segment name, increase padding, add `hover:shadow-card-hover` lift.
- [ ] In `trends.tsx`: add gradients to seasonality and day-of-week bar charts.
- [ ] In `trends.tsx`: style the insight cards with a left accent border that matches the chart colour sequence.
- [ ] In `trends.tsx`: best-month bar gets a glow shadow using `filter: drop-shadow(0 0 6px var(--chart-2))` via inline style.
- [ ] Across all pages: wrap each chart `<div className="h-...">` in `rounded-xl overflow-hidden`.

**Relevant Context**
- `src/routes/index.tsx`, `src/routes/products.tsx`, `src/routes/customers.tsx`, `src/routes/trends.tsx`
- `CHART_COLORS` array in `primitives.tsx` — already 6 tokens, used correctly everywhere.
- Pie chart `stroke="var(--card)"` at `index.tsx:172`, `customers.tsx:143`, `trends.tsx:228`.

---

### Sub-Task 6 — Empty State & Loading State Polish

**Status:** `[ ] pending`

**Intent**
The empty state is the first thing a new user sees. Elevating it with a richer gradient
icon, animated entry, and better button hierarchy makes the onboarding moment feel
premium. The loading skeleton should feel like a real shimmer, not a basic pulse.

**Expected Outcomes**
- Empty state card uses `glass-surface` and a slightly larger max width.
- Icon container is larger (size-16), uses richer `--gradient-hero`, and has a drop-shadow.
- CTA buttons are visually distinct: primary "Load sample data" is gradient-filled; "Upload CSV" is outlined with hover fill.
- The "expected columns" text is styled as a code-like pill list rather than a comma-separated string.
- Loading skeleton uses a moving shimmer animation (`animate-shimmer`) via a CSS gradient sweep.
- Skeleton cards match the real KPI card aspect ratio (not generic `h-32` boxes).

**Todo List**
- [ ] Add `@keyframes shimmer` and `@utility animate-shimmer` to `styles.css`.
- [ ] In `empty-state.tsx`: replace `card-surface` with `glass-surface` on the outer card.
- [ ] Increase icon container to `size-16`, add `shadow-xl shadow-primary/30`.
- [ ] Add `motion-safe:animate-fade-in-up` (or equivalent Tailwind entry animation) to the card.
- [ ] Style "Load sample data" button with inline gradient + white text (consistent with Export button).
- [ ] Replace the comma-separated column hint with a flex-wrap list of `<code>` badges.
- [ ] In `LoadingState`: replace `animate-pulse` with `animate-shimmer` on all skeleton cards.
- [ ] Make skeleton cards taller and vary heights to resemble actual card proportions.

**Relevant Context**
- `src/components/dash/empty-state.tsx` — `EmptyState`, `LoadingState`, `UploadButton`
- `src/styles.css` — add new keyframes and utilities alongside existing `@utility card-surface`.
- `tw-animate-css` is already installed and provides fade/slide entry animations.

---

## Visual Hierarchy Summary

```
Foundation tokens (Sub-Task 1)
        │
        ├── Shell chrome (Sub-Task 2) — sidebar, nav, header
        ├── Data primitives (Sub-Task 3) — KpiCard, Delta, ChartCard, Tooltip
        ├── Controls (Sub-Task 4) — filter bar, buttons
        ├── Charts (Sub-Task 5) — all four pages
        └── States (Sub-Task 6) — empty, loading
```

Each sub-task is independently mergeable. Sub-Task 1 (tokens) should be completed
first since every subsequent task references the new utilities. Sub-tasks 2–6 can be
done in any order after that.

---

## Non-Goals

- No new routes, pages, or analytics features.
- No changes to `src/lib/` files (analytics, csv, store, types).
- No new npm dependencies.
- No changes to routing or TanStack configuration.
- No dark-mode-only changes unless needed to maintain contrast after a light-mode update.
