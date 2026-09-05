"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AuthButton, AuthCard, AuthInput } from "@/components/AuthCard";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [remember, setRemember] = useState(true);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const form = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not sign in");
        return;
      }
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
        return;
      }
      if (data.user?.verificationStatus === "REJECTED") {
        router.push("/pending");
      } else {
        router.push("/chat");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      mode="login"
      title="Welcome to Spark"
      subtitle="Sign in and jump into a one-on-one chat with someone new."
      formTitle="USER LOGIN"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthInput
          name="email"
          type="email"
          required
          placeholder="Email"
          autoComplete={remember ? "email" : "off"}
          icon={<Mail className="h-4 w-4" />}
        />
        <AuthInput
          name="password"
          type="password"
          required
          placeholder="Password"
          autoComplete={remember ? "current-password" : "off"}
          icon={<Lock className="h-4 w-4" />}
        />
        <div className="flex items-center justify-between px-1 text-sm">
          <label className="flex cursor-pointer items-center gap-2 text-[#7c3aed]">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 accent-[#7c3aed]"
            />
            Remember
          </label>
        </div>
        {error && <p className="text-center text-sm text-rose-500">{error}</p>}
        <div className="pt-2">
          <AuthButton disabled={pending}>{pending ? "SIGNING IN..." : "LOGIN"}</AuthButton>
        </div>
      </form>
    </AuthCard>
  );
}
