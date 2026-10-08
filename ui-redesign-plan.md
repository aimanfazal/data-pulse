# UI Redesign Plan — DataPulse

## Overview

Replace the current fixed sidebar in the e-commerce sales analytics app with a **collapsible icon rail**, retheme the entire color palette to a **Slate + Teal/Cyan** scheme, rename the product from "Commerce IQ" to **"DataPulse"**, and replace the logo with an **inline SVG waveform-through-circle mark** using a cyan gradient. All changes are isolated to `app-shell.tsx`, `styles.css`, and the SVG logo.

---

## Sub-Tasks

---

### Sub-Task 1 — Replace Sidebar with Collapsible Icon Rail

**Status:** `[ ] pending`

**Intent**
Remove the fixed 240px sidebar (`<aside>` in `app-shell.tsx`) and replace it with a narrow icon rail that:
- Collapses to **~56px** wide (icons only) by default
- Expands to **~200px** on hover or toggle showing icon + label
- Expands on **mouse enter**, collapses on **mouse leave** (no click toggle needed) — use `onMouseEnter`/`onMouseLeave` on the `<aside>` element
- Retains the same 4 nav items and the dataset widget (icon-only in collapsed state, full in expanded)
- On mobile, keeps the existing horizontal pill-tab nav in the page header (no change)

**Expected Outcomes**
- Desktop layout: Icon rail visible at all times, expands smoothly on hover/toggle
- Collapsed state: Only icons and the logo mark visible; tooltips on hover for labels
- Expanded state: Logo mark + "DataPulse" wordmark + icon + label rows + dataset widget
- No layout shift in the main content area (use CSS `transition` on rail width, main content uses `flex-1`)
- Mobile behaviour unchanged (header tabs)

**Todo List**
1. Add `expanded` boolean state to `AppShell` (default: `false`)
2. Replace the `<aside>` element:
   - Add `onMouseEnter={() => setExpanded(true)}` and `onMouseLeave={() => setExpanded(false)}` on `<aside>`
   - Width: `w-14` (collapsed) or `w-[200px]` (expanded), driven by state, with `transition-all duration-200`
   - No toggle button needed
   - Nav items: render `<Icon />` always; render label `<span>` only when expanded (use `overflow-hidden` + opacity transition)
   - Dataset widget: icon-only (database icon) when collapsed, full widget when expanded
3. Add Radix `<Tooltip>` on each nav icon when collapsed (showing the label) — reuse the existing `Tooltip` primitive from `src/components/ui/tooltip.tsx`
4. Remove `md:flex` from `<aside>` — the rail should always be `flex` on desktop

**Relevant Context**
- `src/components/dash/app-shell.tsx` — entire sidebar lives here (lines 28–82)
- `src/components/ui/tooltip.tsx` — Radix tooltip primitive already exists

---

### Sub-Task 2 — Retheme Colors: Slate + Teal/Cyan

**Status:** `[ ] pending`

**Intent**
Replace all OKLCH color values in `src/styles.css` with a **Slate + Teal/Cyan** palette. The new palette uses slate grays (cool blue-gray hue ~240–250) for backgrounds, surfaces, and muted text, and teal/cyan (hue ~185–200) as the primary/accent/brand color. Both light mode (`:root`) and dark mode (`.dark`) must be updated. Chart colors must also be updated to feel cohesive with the new theme.

**Expected Outcomes**
- Light mode: near-white slate background, slate-tinted cards, teal primary buttons and accents
- Dark mode: deep slate-charcoal background, slightly lighter slate cards, brighter cyan primary
- Icon rail: uses updated sidebar tokens, feels visually integrated with new palette
- Chart series colors: distinct but harmonious — teal, slate-blue, amber, violet, coral, emerald
- All existing semantic tokens remain (no token renames) — only their values change

**Todo List**
1. Update `:root` color values in `src/styles.css`:
   - `--background`: very light slate (near-white with slight cool tint)
   - `--foreground`: deep slate
   - `--card`: pure white or very light slate
   - `--primary`: teal/cyan mid-tone (hue ~190)
   - `--secondary`, `--muted`: lighter slates
   - `--accent`: light cyan tint
   - `--ring`: teal mid-tone
   - `--sidebar`, `--sidebar-primary`, `--sidebar-accent`, etc.: dark slate + cyan
   - `--chart-1` through `--chart-6`: teal, slate-blue, amber, violet, coral, emerald
   - `--gradient-hero`: cyan-to-teal gradient
2. Update `.dark` color values with appropriate dark-mode OKLCH equivalents
3. Update `--shadow-card` and `--shadow-card-hover` tint to slate hue

**Relevant Context**
- `src/styles.css` — all color definitions live here (lines 69–152)
- Tailwind Slate hue ≈ 225–240 in OKLCH, Teal/Cyan hue ≈ 185–200 in OKLCH

---

### Sub-Task 3 — Rename to "DataPulse" and Replace Logo

**Status:** `[ ] pending`

**Intent**
Replace all occurrences of "Commerce IQ" with **"DataPulse"** and swap the `<BarChart3>` Lucide icon in the logo slot with a custom inline SVG: a **circle with a waveform/heartbeat line** drawn through it, using a cyan gradient fill.

**Expected Outcomes**
- Logo mark: a circle containing a heartbeat/pulse waveform path, rendered as an inline `<svg>`, with a cyan-to-teal gradient applied to the stroke or fill
- Wordmark: "DataPulse" in semibold weight (replaces "Commerce IQ")
- Tagline below: **"Analytics Platform"**
- Page `<title>` tag (in `__root.tsx`) updated if present
- No Lucide `BarChart3` icon used in the logo anymore

**Todo List**
1. Create a `<DataPulseLogo />` inline SVG component within `app-shell.tsx` (or a small separate file `src/components/dash/logo.tsx`):
   - Outer circle, stroke only, with gradient definition (`<defs><linearGradient>`)
   - Inner waveform path (flat → sharp spike → return to flat, like an ECG beat)
   - Gradient direction: left-to-right, from cyan (`oklch(0.75 0.18 190)`) to teal (`oklch(0.55 0.17 185)`)
   - Size: 36×36, fits the existing `size-9` slot
2. Replace the `<BarChart3>` span in `app-shell.tsx` logo section with `<DataPulseLogo />`
3. Replace the `"Commerce IQ"` string with `"DataPulse"`
4. Search for any other occurrences of "Commerce IQ" across the codebase and update them

**Relevant Context**
- `src/components/dash/app-shell.tsx` lines 37–48 — logo block
- `src/__root.tsx` or page `<title>` tags — check for brand name occurrences
- `src/components/ui/sidebar.tsx` — check if brand name appears there too

---

## Implementation Order

```
Sub-Task 1 (Icon Rail) → Sub-Task 2 (Colors) → Sub-Task 3 (Logo + Name)
```

Sub-Task 1 first because the layout structure change is the most disruptive. Colors second because they are pure CSS value swaps with no JSX changes. Logo/name last as it is purely cosmetic on top of the new layout and colors.

---

## Files Changed

| File | Sub-Task |
|------|----------|
| `src/components/dash/app-shell.tsx` | 1, 3 |
| `src/styles.css` | 2 |
| `src/components/dash/logo.tsx` *(new)* | 3 |
| `src/__root.tsx` | 3 (title tag) |
