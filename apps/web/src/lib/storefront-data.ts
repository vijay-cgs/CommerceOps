export type Product = {
  id: string;
  slug: string;
  name: string;
  price: number;
  tag: string;
  category: string;
  description: string;
  accent: string;
  features: string[];
};

export const products: Product[] = [
  {
    id: "p-100",
    slug: "aerolite-backpack",
    name: "AeroLite Backpack",
    price: 129,
    tag: "Best seller",
    category: "Travel",
    description: "A lightweight, weather-ready backpack built for city commutes and weekend escapes.",
    accent: "from-sky-500 to-cyan-500",
    features: ["Water resistant shell", "Laptop sleeve", "Hidden security pocket"],
  },
  {
    id: "p-101",
    slug: "coredesk-lamp",
    name: "CoreDesk Lamp",
    price: 89,
    tag: "New arrival",
    category: "Workspace",
    description: "An adjustable LED desk lamp that brings a warm, focused glow to every work session.",
    accent: "from-violet-500 to-fuchsia-500",
    features: ["Touch dimmer", "USB-C power", "Low-glare optics"],
  },
  {
    id: "p-102",
    slug: "terra-bottle",
    name: "Terra Bottle",
    price: 34,
    tag: "Daily essential",
    category: "Lifestyle",
    description: "A stainless steel insulated bottle that keeps drinks cold for up to 24 hours.",
    accent: "from-emerald-500 to-teal-500",
    features: ["Double wall insulated", "Leak-proof lid", "BPA free"],
  },
  {
    id: "p-103",
    slug: "stride-running-shoes",
    name: "Stride Runner",
    price: 149,
    tag: "Performance",
    category: "Fitness",
    description: "Responsive everyday running shoes designed for comfort, stability, and all-day motion.",
    accent: "from-amber-500 to-orange-500",
    features: ["Cushioned midsole", "Breathable mesh", "Grip-ready outsole"],
  },
];

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}
