import Link from "next/link";
import { SparkMark } from "./ui";
import type { ReactNode } from "react";

export function AppHeader({
  right,
}: {
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center justify-between border-b border-border bg-black/25 px-5 py-4 backdrop-blur-md">
      <Link href="/">
        <SparkMark />
      </Link>
      <div className="flex items-center gap-3">{right}</div>
    </header>
  );
}
