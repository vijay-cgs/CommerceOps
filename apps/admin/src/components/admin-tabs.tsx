"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Hrefs are zone-relative; Next prefixes them with the /admin basePath.
const tabs = [
  { href: "/products", label: "Products" },
  { href: "/inventory", label: "Inventory" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex gap-4 border-b border-slate-200 pb-4 text-sm font-medium">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={isActive ? "text-slate-900" : "text-slate-600 hover:text-slate-900"}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
