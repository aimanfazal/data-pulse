import type { Order } from "./types";

// Deterministic pseudo-random generator so sample data is stable.
function mulberry32(seed: number) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CATALOG: { name: string; category: string; price: number }[] = [
  { name: "Aurora Wireless Headphones", category: "Electronics", price: 189 },
  { name: "Nimbus 14 Laptop Sleeve", category: "Electronics", price: 39 },
  { name: "Pulse Smart Watch S3", category: "Electronics", price: 249 },
  { name: "Vertex 4K Webcam", category: "Electronics", price: 129 },
  { name: "Echo Bluetooth Speaker", category: "Electronics", price: 89 },
  { name: "Merino Wool Overshirt", category: "Apparel", price: 118 },
  { name: "Everyday Cotton Tee", category: "Apparel", price: 28 },
  { name: "Trailhead Rain Jacket", category: "Apparel", price: 164 },
  { name: "Cloudstep Running Shoes", category: "Apparel", price: 132 },
  { name: "Ceramic Pour-Over Set", category: "Home & Kitchen", price: 64 },
  { name: "Cast Iron Skillet 12in", category: "Home & Kitchen", price: 74 },
  { name: "Linen Duvet Cover", category: "Home & Kitchen", price: 148 },
  { name: "Aroma Diffuser Mini", category: "Home & Kitchen", price: 45 },
  { name: "Vitamin C Glow Serum", category: "Beauty", price: 52 },
  { name: "Hydra Repair Night Cream", category: "Beauty", price: 68 },
  { name: "Bamboo Toothbrush Pack", category: "Beauty", price: 16 },
  { name: "Carbon Yoga Mat Pro", category: "Sports & Outdoors", price: 96 },
  { name: "Alpine Trekking Poles", category: "Sports & Outdoors", price: 78 },
  { name: "Hydro Insulated Bottle", category: "Sports & Outdoors", price: 34 },
  { name: "Adjustable Dumbbell 20kg", category: "Sports & Outdoors", price: 219 },
];

const REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"];
const PAYMENTS = ["Credit Card", "PayPal", "Apple Pay", "Bank Transfer", "Gift Card"];
const FIRST = [
  "Amara","Liam","Sofia","Noah","Priya","Ethan","Mia","Hugo","Zara","Ivan",
  "Lena","Omar","Chloe","Diego","Aisha","Marco","Yuki","Nora","Sam","Tariq",
  "Elena","Jonas","Farah","Kai","Ines","Pedro","Hana","Leo","Maya","Victor",
];
const LAST = [
  "Okafor","Bennett","Rossi","Kim","Sharma","Novak","Dubois","Haddad","Silva","Petrov",
  "Andersen","Nakamura","Costa","Weber","Ali","Moreau","Larsen","Fischer","Reyes","Osei",
];

export function generateSampleOrders(): Order[] {
  const rnd = mulberry32(20260905);
  const today = new Date();
  const customers = Array.from({ length: 140 }, (_, i) => ({
    id: `C-${String(1000 + i)}`,
    name: `${FIRST[Math.floor(rnd() * FIRST.length)]!} ${LAST[Math.floor(rnd() * LAST.length)]!}`,
    region: REGIONS[Math.floor(rnd() * REGIONS.length)]!,
    loyalty: rnd(),
  }));

  const orders: Order[] = [];
  let n = 0;
  for (let monthBack = 11; monthBack >= 0; monthBack--) {
    const base = new Date(today.getFullYear(), today.getMonth() - monthBack, 1);
    const month = base.getMonth();
    // seasonality: strong Nov/Dec, soft Feb
    const seasonal = [0.85, 0.78, 0.92, 0.98, 1.0, 1.05, 1.02, 0.97, 1.08, 1.15, 1.38, 1.45][month]!;
    const growth = 1 + (11 - monthBack) * 0.035;
    const count = Math.round(38 * seasonal * growth);
    const daysInMonth = new Date(base.getFullYear(), month + 1, 0).getDate();

    for (let i = 0; i < count; i++) {
      const cust = customers[Math.floor(rnd() * rnd() * customers.length)]!;
      const product = CATALOG[Math.floor(rnd() * CATALOG.length)]!;
      const day = 1 + Math.floor(rnd() * daysInMonth);
      const date = new Date(base.getFullYear(), month, day);
      if (date > today) continue;
      const quantity = 1 + Math.floor(rnd() * (rnd() > 0.8 ? 4 : 2));
      const unit_price = Math.round(product.price * (0.9 + rnd() * 0.25) * 100) / 100;
      orders.push({
        order_id: `ORD-${String(10000 + n++)}`,
        order_date: date.toISOString().slice(0, 10),
        customer_id: cust.id,
        customer_name: cust.name,
        product_name: product.name,
        category: product.category,
        quantity,
        unit_price,
        total_amount: Math.round(unit_price * quantity * 100) / 100,
        region: rnd() > 0.15 ? cust.region : REGIONS[Math.floor(rnd() * REGIONS.length)]!,
        payment_method: PAYMENTS[Math.floor(rnd() * rnd() * PAYMENTS.length)]!,
      });
    }
  }
  return orders.sort((a, b) => a.order_date.localeCompare(b.order_date));
}
