export interface Order {
  order_id: string;
  order_date: string; // ISO yyyy-mm-dd
  customer_id: string;
  customer_name: string;
  product_name: string;
  category: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  region: string;
  payment_method: string;
}

export interface Filters {
  from: string; // ISO date
  to: string;
  categories: string[];
  regions: string[];
  segments: string[];
}

export type SegmentName =
  | "Champions"
  | "Loyal"
  | "Potential"
  | "New Customers"
  | "At Risk"
  | "Hibernating";

export const SEGMENTS: SegmentName[] = [
  "Champions",
  "Loyal",
  "Potential",
  "New Customers",
  "At Risk",
  "Hibernating",
];
