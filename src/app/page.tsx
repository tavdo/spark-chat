import Link from "next/link";
import { Button, SparkMark } from "@/components/ui";

export default function Home() {
  return (
    <div className="glow-bg flex min-h-full flex-col">
      <header className="flex items-center justify-between px-6 py-5">
        <SparkMark />
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost">Sign in</Button>
          </Link>
          <Link href="/register">
            <Button>Get verified</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 pt-10 text-center">
        <p className="mb-4 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Verified random chat
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Meet a stranger.
          <span className="block text-accent">Skip anytime.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Face-verified people only. One-on-one text, photos, voice notes, and GIFs — no feed, no followers, no waiting around.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link href="/register">
            <Button className="px-8 py-3 text-base">Start chatting</Button>
          </Link>
          <Link href="/login">
            <Button variant="ghost" className="px-8 py-3 text-base">
              I already have an account
            </Button>
          </Link>
        </div>
        <p className="mt-12 text-sm text-muted">
          Moderator?{" "}
          <Link href="/admin/login" className="text-accent hover:underline">
            Open the admin panel
          </Link>
        </p>
        <div className="mt-16 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {["Text", "Photo", "Voice", "GIFs"].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-surface/70 px-4 py-5 text-sm font-medium"
            >
              {item}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
