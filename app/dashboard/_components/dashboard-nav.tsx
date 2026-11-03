"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Add entries here as dashboard sections are built.
const items = [
  { href: "/dashboard", label: "Overview", exact: true },
  { href: "/dashboard/orders", label: "Orders", exact: false },
  { href: "/dashboard/products", label: "Products", exact: false },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 md:flex-col">
      {items.map(({ href, label, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm ${active ? "bg-foreground/10 font-medium" : "text-foreground/70 hover:bg-foreground/5"
              }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
