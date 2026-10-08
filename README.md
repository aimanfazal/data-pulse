# DataPulse — E-Commerce Sales Analytics

A client-side analytics dashboard for e-commerce order data. Load your own CSV or explore the built-in sample dataset to get instant visibility into revenue, product performance, customer behaviour, and growth trends — no backend required.

---

## Features

### Overview Dashboard (`/`)
- **KPI cards** — total revenue, orders, average order value, and unique customers, each with a period-over-period delta
- **Revenue trend** — area chart switchable between monthly and weekly granularity
- **Category mix** — donut chart showing each category's share of revenue
- **Regional performance** — horizontal bar chart comparing revenue across regions
- **Top 5 products** — table ranked by revenue for the current filter window

### Product Performance (`/products`)
- Top performers and underperformers lists with growth indicators
- Category revenue bar chart with click-to-drill-down interaction
- Full sortable product table (units sold, revenue, average price, half-period growth)
- Search by product name or category

### Customer Insights (`/customers`)
- New vs. returning customer split (donut chart)
- Customer lifetime value distribution across five spend bands
- **RFM segmentation** — customers automatically classified into Champions, Loyal, Potential, New Customers, At Risk, and Hibernating based on recency, frequency, and monetary value
- Top 10 customers by lifetime spend (horizontal bar chart)
- Searchable, sortable full customer table with segment, AOV, and days-since-last-order

### Trends & Growth (`/trends`)
- **Auto-generated insights** — plain-English observations derived from the data in view (MoM change, top category, regional AOV leader, fastest-rising product, at-risk segment recovery opportunity, etc.)
- Month-over-month composed chart (revenue bars + MoM % line overlay)
- Year-over-year comparison (requires at least two years of data)
- Payment method breakdown (donut chart)
- Seasonality by calendar month
- Revenue by day of week
- Monthly detail table with MoM delta column

### Global controls (filter bar)
- Date range picker constrained to the dataset bounds
- Multi-select dropdowns for category, region, and RFM segment
- Reset button restores filters to full dataset range
- **CSV upload** — drag-and-drop or file picker; accepts any CSV with an `order_date` column (header names are normalised automatically)
- **Sample data** button reloads the built-in synthetic dataset
- **Export summary** downloads a pre-built CSV covering KPIs, category breakdown, regional breakdown, top products, and top customers for the current filter window

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [TanStack Start](https://tanstack.com/start) (React 19, file-based routing) |
| Routing | `@tanstack/react-router` with auto-generated route tree |
| State | React Context (`DashboardProvider`) + `sessionStorage` persistence |
| Charts | [Recharts](https://recharts.org/) |
| UI primitives | [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Tailwind CSS v4) |
| CSV parsing | [PapaParse](https://www.papaparse.com/) |
| Build | Vite 8 |
| Runtime / package manager | Bun |
| Language | TypeScript 5 |

---

## Getting Started

### Prerequisites
- [Bun](https://bun.sh/) ≥ 1.0

### Install & run

```bash
bun install
bun run dev
```

Open `http://localhost:3000`. The dashboard loads with a built-in sample dataset automatically.

### Build for production

```bash
bun run build
bun run preview
```

### Lint / format

```bash
bun run lint
bun run format
```

---

## CSV Format

Upload any CSV file that contains at minimum an `order_date` column. Column headers are trimmed and lowercased, so spacing and capitalisation do not matter. Recognised columns:

| Column | Aliases | Notes |
|---|---|---|
| `order_id` | — | Falls back to row index if missing |
| `order_date` | `date` | ISO `YYYY-MM-DD` or any parseable date string |
| `customer_id` | — | Falls back to `customer_name` |
| `customer_name` | — | Falls back to `customer_id` |
| `product_name` | `product` | |
| `category` | — | Defaults to `Uncategorized` |
| `quantity` | — | Defaults to `1` |
| `unit_price` | `price` | Inferred from total ÷ quantity if absent |
| `total_amount` | `total` | Inferred from unit_price × quantity if absent |
| `region` | — | Defaults to `Unspecified` |
| `payment_method` | — | Defaults to `Unspecified` |

---

## Project Structure

```
src/
├── routes/
│   ├── __root.tsx          # App shell — wraps every page
│   ├── index.tsx           # / — Overview dashboard
│   ├── products.tsx        # /products — Product performance
│   ├── customers.tsx       # /customers — Customer insights
│   └── trends.tsx          # /trends — Trends & growth
├── components/
│   ├── dash/               # Dashboard-specific components
│   │   ├── app-shell.tsx   # Page layout wrapper
│   │   ├── filter-bar.tsx  # Global filter controls
│   │   ├── primitives.tsx  # KpiCard, ChartCard, Delta, etc.
│   │   └── sortable.tsx    # Reusable sort hook and header
│   └── ui/                 # shadcn/ui component library
└── lib/
    ├── analytics.ts        # All aggregation, RFM, and insight logic
    ├── csv.ts              # CSV parsing and export utilities
    ├── dashboard-store.tsx # DashboardProvider context
    ├── sample-data.ts      # Synthetic order generator
    └── types.ts            # Order, Filters, SegmentName types
```

---

## RFM Segmentation Logic

Customer segments are computed from the full (unfiltered) dataset so that segment membership is stable regardless of the active date range. Thresholds are percentile-based:

| Segment | Criteria |
|---|---|
| **Champions** | Recent (≤ P40 recency), frequent (≥ P66 orders), high value (≥ P66 revenue) |
| **Loyal** | Recent and either frequent or high value |
| **New Customers** | Recent with only one order |
| **Potential** | Recent but not yet frequent or valuable |
| **At Risk** | Not recent (≥ P75 recency days) but previously frequent or high value |
| **Hibernating** | Not recent and low engagement |

The Segment filter in the toolbar then narrows the order view to only orders from customers in the selected segments.