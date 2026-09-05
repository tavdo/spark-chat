"use client";

import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";

const OPTIONS: { value: Locale; label: string }[] = [
  { value: "en", label: "EN" },
  { value: "ka", label: "ქარ" },
];

export function LanguageSwitch({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  return (
    <div
      role="group"
      aria-label={t("lang.label")}
      className={cn(
        "inline-flex rounded-full border border-white/20 bg-black/25 p-0.5 text-[11px] font-semibold",
        className
      )}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => setLocale(opt.value)}
          className={cn(
            "rounded-full px-2.5 py-1 transition",
            locale === opt.value
              ? "bg-white/20 text-white"
              : "text-white/60 hover:text-white"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
