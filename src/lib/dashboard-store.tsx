import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  applyFilters,
  customerStats,
  dateBounds,
  previousPeriod,
  uniqueValues,
} from "./analytics";
import { generateSampleOrders } from "./sample-data";
import type { Filters, Order, SegmentName } from "./types";

interface DashboardContextValue {
  allOrders: Order[];
  orders: Order[];
  previousOrders: Order[];
  filters: Filters;
  setFilters: (patch: Partial<Filters>) => void;
  resetFilters: () => void;
  hasData: boolean;
  loading: boolean;
  sourceName: string;
  loadSample: () => void;
  loadOrders: (orders: Order[], sourceName: string) => void;
  clearData: () => void;
  options: { categories: string[]; regions: string[]; segments: SegmentName[] };
  bounds: { min: string; max: string };
  segmentByCustomer: Map<string, SegmentName>;
}

const emptyFilters: Filters = {
  from: "",
  to: "",
  categories: [],
  regions: [],
  segments: [],
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [filters, setFiltersState] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(false);
  const [sourceName, setSourceName] = useState("");

  const bounds = useMemo(() => dateBounds(allOrders), [allOrders]);

  const segmentByCustomer = useMemo(() => {
    const map = new Map<string, SegmentName>();
    for (const c of customerStats(allOrders)) map.set(c.customer_id, c.segment);
    return map;
  }, [allOrders]);

  const orders = useMemo(
    () => applyFilters(allOrders, filters, segmentByCustomer),
    [allOrders, filters, segmentByCustomer],
  );

  const previousOrders = useMemo(() => {
    const from = filters.from || bounds.min;
    const to = filters.to || bounds.max;
    const prev = previousPeriod(allOrders, from, to);
    return applyFilters(prev, { ...filters, from: "", to: "" }, segmentByCustomer);
  }, [allOrders, filters, bounds, segmentByCustomer]);

  const options = useMemo(
    () => ({
      categories: uniqueValues(allOrders, "category"),
      regions: uniqueValues(allOrders, "region"),
      segments: Array.from(new Set(segmentByCustomer.values())).sort() as SegmentName[],
    }),
    [allOrders, segmentByCustomer],
  );

  const install = useCallback((rows: Order[], name: string) => {
    const b = dateBounds(rows);
    setAllOrders(rows);
    setSourceName(name);
    setFiltersState({ ...emptyFilters, from: b.min, to: b.max });
    try {
      sessionStorage.setItem("ciq-dataset", JSON.stringify({ name, rows }));
    } catch {
      /* dataset too large to cache — keep it in memory only */
    }
  }, []);

  // Load the cached dataset (or the sample dataset) once on the client so the
  // dashboard is demo-able immediately and survives page refreshes.
  const bootstrapped = useRef(false);
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    try {
      const cached = sessionStorage.getItem("ciq-dataset");
      if (cached) {
        const parsed = JSON.parse(cached) as { name: string; rows: Order[] };
        if (parsed?.rows?.length) {
          install(parsed.rows, parsed.name);
          return;
        }
      }
    } catch {
      /* ignore malformed cache */
    }
    install(generateSampleOrders(), "Sample dataset");
  }, [install]);

  const loadSample = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      install(generateSampleOrders(), "Sample dataset");
      setLoading(false);
    }, 450);
  }, [install]);

  const loadOrders = useCallback(
    (rows: Order[], name: string) => {
      setLoading(true);
      setTimeout(() => {
        install(rows, name);
        setLoading(false);
      }, 200);
    },
    [install],
  );

  const value: DashboardContextValue = {
    allOrders,
    orders,
    previousOrders,
    filters,
    setFilters: (patch) => setFiltersState((f) => ({ ...f, ...patch })),
    resetFilters: () =>
      setFiltersState({ ...emptyFilters, from: bounds.min, to: bounds.max }),
    hasData: allOrders.length > 0,
    loading,
    sourceName,
    loadSample,
    loadOrders,
    clearData: () => {
      try {
        sessionStorage.removeItem("ciq-dataset");
      } catch {
        /* ignore */
      }
      setAllOrders([]);
      setSourceName("");
      setFiltersState(emptyFilters);
    },
    options,
    bounds,
    segmentByCustomer,
  };

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used inside DashboardProvider");
  return ctx;
}
