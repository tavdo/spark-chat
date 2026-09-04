"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Flag, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { AdminSignOut } from "./AdminSignOut";
import { SparkMark } from "./ui";
import { cn } from "@/lib/utils";

type Stats = {
  pendingVerifications: number;
  openReports: number;
};

const items = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  {
    href: "/admin/verifications",
    label: "Verification",
    icon: ShieldCheck,
    countKey: "pendingVerifications" as const,
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: Flag,
    countKey: "openReports" as const,
  },
  { href: "/admin/users", label: "Users", icon: Users },
];

export function AdminNav() {
  const pathname = usePathname();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) =>
        setStats({
          pendingVerifications: data.pendingVerifications || 0,
          openReports: data.openReports || 0,
        })
      )
      .catch(() => null);
  }, [pathname]);

  return (
    <>
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface p-5 md:flex">
        <Link href="/admin">
          <SparkMark />
        </Link>
        <p className="mt-2 px-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">
          Moderation
        </p>
        <nav className="mt-6 flex-1 space-y-1">
          {items.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const count = item.countKey ? stats?.[item.countKey] : 0;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm",
                  active
                    ? "bg-accent-strong text-white"
                    : "text-muted hover:bg-surface-2 hover:text-text"
                )}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                {!!count && (
                  <span
                    className={cn(
                      "grid min-w-5 place-items-center rounded-full px-1.5 text-[11px] font-bold",
                      active ? "bg-white/20" : "bg-accent-strong text-white"
                    )}
                  >
                    {count}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <AdminSignOut />
      </aside>
      <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
        <SparkMark />
        <div className="flex gap-1 overflow-x-auto">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full px-3 py-1.5 text-xs font-semibold",
                pathname === item.href ||
                  (!item.exact && pathname.startsWith(item.href))
                  ? "bg-accent-strong text-white"
                  : "text-muted"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
    </>
  );
}

export function FilterTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-full bg-surface-2 p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-semibold",
            value === opt.value ? "bg-accent-strong text-white" : "text-muted"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
