import Papa from "papaparse";
import type { Order } from "./types";

const num = (v: unknown) => {
  const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const normalizeDate = (v: unknown) => {
  const s = String(v ?? "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
};

export function parseOrdersCsv(file: File): Promise<Order[]> {
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase().replace(/\s+/g, "_"),
      complete: (res) => {
        try {
          const rows: Order[] = [];
          res.data.forEach((r, i) => {
            const date = normalizeDate(r["order_date"] ?? r["date"]);
            if (!date) return;
            const quantity = num(r["quantity"]) || 1;
            const unit_price = num(r["unit_price"] ?? r["price"]);
            const total = num(r["total_amount"] ?? r["total"]) || unit_price * quantity;
            rows.push({
              order_id: (r["order_id"] || `ROW-${i + 1}`).trim(),
              order_date: date,
              customer_id: (r["customer_id"] || r["customer_name"] || `CUST-${i}`).trim(),
              customer_name: (r["customer_name"] || r["customer_id"] || "Unknown").trim(),
              product_name: (r["product_name"] || r["product"] || "Unknown product").trim(),
              category: (r["category"] || "Uncategorized").trim(),
              quantity,
              unit_price: unit_price || (quantity ? total / quantity : 0),
              total_amount: total,
              region: (r["region"] || "Unspecified").trim(),
              payment_method: (r["payment_method"] || "Unspecified").trim(),
            });
          });
          if (!rows.length) reject(new Error("No usable rows found in this file."));
          else resolve(rows.sort((a, b) => a.order_date.localeCompare(b.order_date)));
        } catch (e) {
          reject(e as Error);
        }
      },
      error: (err) => reject(err),
    });
  });
}

export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) =>
      r
        .map((c) => {
          const s = String(c ?? "");
          return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    )
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
