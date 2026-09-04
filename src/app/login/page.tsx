"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, SparkMark } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not sign in");
      return;
    }
    if (data.user?.role === "ADMIN") {
      router.push("/admin");
      return;
    }
    if (data.user?.verificationStatus === "APPROVED") {
      router.push("/chat");
    } else {
      router.push("/pending");
    }
  }

  return (
    <div className="glow-bg flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-6">
        <Link href="/">
          <SparkMark />
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Welcome back</h1>
          <p className="mt-1 text-sm text-muted">Sign in to jump into a chat.</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <Field label="Email">
            <Input name="email" type="email" required placeholder="you@email.com" />
          </Field>
          <Field label="Password">
            <Input name="password" type="password" required />
          </Field>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button className="w-full" disabled={pending}>
            {pending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        <p className="text-sm text-muted">
          New here?{" "}
          <Link href="/register" className="text-accent hover:underline">
            Create an account
          </Link>
        </p>
      </Card>
    </div>
  );
}
