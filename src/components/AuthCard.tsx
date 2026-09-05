import Link from "next/link";
import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils";

function NightSky() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 280"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <linearGradient id="auth-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3a1a6e" />
          <stop offset="55%" stopColor="#4b2088" />
          <stop offset="100%" stopColor="#2a104f" />
        </linearGradient>
        <radialGradient id="auth-moon" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.42)" />
          <stop offset="70%" stopColor="rgba(255,255,255,0.12)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </radialGradient>
      </defs>
      <rect width="400" height="280" fill="url(#auth-sky)" />
      <circle cx="318" cy="58" r="52" fill="url(#auth-moon)" />
      {[
        [28, 36],
        [62, 22],
        [96, 48],
        [140, 18],
        [188, 40],
        [230, 16],
        [268, 52],
        [348, 28],
        [372, 64],
        [44, 78],
        [118, 72],
        [210, 68],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.4 : 0.9} fill="white" opacity={0.7} />
      ))}
      <line x1="40" y1="58" x2="92" y2="42" stroke="white" strokeWidth="1.1" opacity="0.55" />
      <line x1="160" y1="30" x2="204" y2="18" stroke="white" strokeWidth="1" opacity="0.4" />
      <line x1="250" y1="78" x2="300" y2="64" stroke="white" strokeWidth="1" opacity="0.35" />
      <path d="M0 188 C70 148 130 176 190 158 C250 140 300 168 400 132 L400 280 L0 280 Z" fill="#4a1d7c" />
      <path d="M0 214 C90 176 160 208 230 190 C300 172 340 198 400 176 L400 280 L0 280 Z" fill="#2d1258" />
    </svg>
  );
}

export function AuthCard({
  title,
  subtitle,
  formTitle,
  children,
  wide,
  mode,
}: {
  title: string;
  subtitle: string;
  formTitle: string;
  children: ReactNode;
  wide?: boolean;
  mode: "login" | "register" | "admin";
}) {
  return (
    <div className="auth-night flex min-h-full items-center justify-center p-4 sm:p-8">
      <div
        className={cn(
          "w-full overflow-hidden rounded-[28px] shadow-[0_30px_80px_rgba(20,8,40,0.55)]",
          wide ? "max-w-lg" : "max-w-[420px]"
        )}
      >
        <div className="relative min-h-[220px] px-8 pb-8 pt-10 text-white sm:min-h-[240px]">
          <NightSky />
          <div className="relative z-10">
            <Link href="/" className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
              Spark
            </Link>
            <h1 className="mt-6 text-[28px] font-semibold leading-tight">{title}</h1>
            <p className="mt-3 max-w-[16rem] text-sm leading-relaxed text-white/75">{subtitle}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/register"
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white transition",
                  mode === "register"
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-[#2a104f] ring-1 ring-white/70 hover:bg-white/10"
                )}
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className={cn(
                  "inline-flex items-center justify-center rounded-full px-5 py-2 text-sm font-semibold text-white transition",
                  mode === "login"
                    ? "bg-white/20 ring-2 ring-white"
                    : "bg-[#2a104f] ring-1 ring-white/70 hover:bg-white/10"
                )}
              >
                User Login
              </Link>
            </div>
          </div>
        </div>
        <div className="bg-white px-8 py-8 text-[#4c1d95] sm:px-10 sm:py-9">
          <h2 className="mb-6 text-center text-lg font-semibold tracking-[0.18em]">{formTitle}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}

export function AuthInput({
  icon,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { icon: ReactNode }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-white">
        {icon}
      </span>
      <input
        {...props}
        className={cn(
          "w-full rounded-full border-0 bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa] py-3 pl-12 pr-5 text-sm text-white outline-none placeholder:text-white/80 focus:ring-2 focus:ring-[#7c3aed]/40",
          className
        )}
      />
    </label>
  );
}

export function AuthSelect({
  icon,
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { icon: ReactNode }) {
  return (
    <label className="relative block">
      <span className="pointer-events-none absolute left-5 top-1/2 z-10 -translate-y-1/2 text-white">
        {icon}
      </span>
      <select
        {...props}
        className={cn(
          "w-full appearance-none rounded-full border-0 bg-gradient-to-r from-[#c4b5fd] to-[#a78bfa] py-3 pl-12 pr-5 text-sm text-white outline-none focus:ring-2 focus:ring-[#7c3aed]/40 [&_option]:bg-white [&_option]:text-[#4c1d95]",
          className
        )}
      >
        {children}
      </select>
    </label>
  );
}

export function AuthButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "mx-auto block rounded-md bg-[#7c3aed] px-10 py-2.5 text-sm font-semibold tracking-[0.16em] text-white transition hover:bg-[#6d28d9] disabled:opacity-50",
        className
      )}
    >
      {children}
    </button>
  );
}
