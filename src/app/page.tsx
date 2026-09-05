import Link from "next/link";
import { BrandArt, Button, SparkMark } from "@/components/ui";

const features = [
  {
    src: "/brand/logo.jpg",
    title: "Instant chat",
    body: "Send a selfie and talk to a stranger right away. Skip whenever you want.",
  },
  {
    src: "/brand/logo-glow.jpg",
    title: "Live matching",
    body: "One-on-one text, photos, voice notes, and GIFs — no feed.",
  },
  {
    src: "/brand/shield.jpg",
    title: "Selfie first",
    body: "No waiting on admin. If a photo is rejected later, that account is blocked from chat.",
  },
];

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
            <Button>Join now</Button>
          </Link>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 pb-24 pt-6 text-center">
        <BrandArt
          src="/brand/logo.jpg"
          alt=""
          className="mb-4 h-28 w-28 rounded-3xl object-cover ring-1 ring-accent/20 sm:h-36 sm:w-36"
        />
        <BrandArt
          src="/brand/wordmark.jpg"
          alt="SPARK"
          className="mb-6 h-14 w-auto max-w-[min(100%,420px)] object-contain mix-blend-screen sm:h-16"
        />
        <p className="mb-4 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Verified random chat
        </p>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[1.05] tracking-tight sm:text-7xl">
          Meet a stranger.
          <span className="block text-accent">Skip anytime.</span>
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted">
          Send a live selfie, then jump into one-on-one text, photos, voice, and GIFs. No waiting on admin approval.
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
        <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-border bg-surface/70 px-4 py-6 backdrop-blur-xl"
            >
              <BrandArt
                src={item.src}
                alt=""
                className="mx-auto mb-4 h-20 w-20 rounded-2xl object-cover ring-1 ring-accent/20"
              />
              <p className="font-semibold">{item.title}</p>
              <p className="mt-2 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
          {["Text", "Photo", "Voice", "GIFs"].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-surface/70 px-4 py-5 text-sm font-medium backdrop-blur-xl"
            >
              {item}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
