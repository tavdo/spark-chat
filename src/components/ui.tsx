"use client";

import { statusKey, useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";

export function BrandArt({
  src,
  alt = "",
  className,
}: {
  src: string;
  alt?: string;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}

export function SparkMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandArt
        src="/brand/logo.jpg"
        alt="Spark"
        className="h-9 w-9 rounded-xl object-cover ring-1 ring-accent/25"
      />
      <span className="text-lg font-semibold tracking-tight">Spark</span>
    </div>
  );
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle";
}) {
  const styles = {
    primary:
      "bg-accent-strong text-white hover:bg-accent shadow-[0_0_24px_rgba(168,85,247,0.28)]",
    ghost: "bg-transparent text-text hover:bg-surface-2 border border-border",
    danger: "bg-danger text-white hover:brightness-110",
    subtle: "bg-surface-2 text-text hover:bg-border",
  }[variant];

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50 disabled:pointer-events-none",
        styles,
        className
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm text-muted">{label}</span>
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none placeholder:text-muted/70 focus:border-accent",
        props.className
      )}
    />
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-border bg-surface/80 p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function StatusBadge({
  status,
}: {
  status: string;
}) {
  const { t } = useI18n();
  const key = statusKey(status);
  const map: Record<string, string> = {
    PENDING: "bg-amber-400/15 text-amber-300",
    APPROVED: "bg-success/15 text-success",
    REJECTED: "bg-danger/15 text-danger",
    ACTIVE: "bg-success/15 text-success",
    WARNED: "bg-amber-400/15 text-amber-300",
    SUSPENDED: "bg-orange-400/15 text-orange-300",
    BANNED: "bg-danger/15 text-danger",
    OPEN: "bg-accent/15 text-accent",
    ACTIONED: "bg-success/15 text-success",
    DISMISSED: "bg-muted/15 text-muted",
    SPAM: "bg-amber-400/15 text-amber-300",
    INAPPROPRIATE: "bg-danger/15 text-danger",
    FAKE_PROFILE: "bg-orange-400/15 text-orange-300",
    HARASSMENT: "bg-danger/15 text-danger",
    OTHER: "bg-surface-2 text-muted",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        map[status] || "bg-surface-2 text-muted"
      )}
    >
      {key ? t(key) : status.toLowerCase().replace("_", " ")}
    </span>
  );
}
