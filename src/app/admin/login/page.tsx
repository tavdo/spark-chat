"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AuthButton, AuthCard, AuthInput } from "@/components/AuthCard";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
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
    if (data.user?.role !== "ADMIN") {
      setError("Admin only");
      return;
    }
    router.push("/admin");
  }

  return (
    <AuthCard
      mode="admin"
      title="Welcome back"
      subtitle="Moderator access for verification, reports, and user safety."
      formTitle="MODERATOR LOGIN"
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthInput
          name="email"
          type="email"
          required
          defaultValue="admin@spark.local"
          placeholder="Email"
          icon={<Mail className="h-4 w-4" />}
        />
        <AuthInput
          name="password"
          type="password"
          required
          defaultValue="changeme-admin"
          placeholder="Password"
          icon={<Lock className="h-4 w-4" />}
        />
        {error && <p className="text-center text-sm text-rose-500">{error}</p>}
        <div className="pt-2">
          <AuthButton disabled={pending}>{pending ? "SIGNING IN..." : "LOGIN"}</AuthButton>
        </div>
      </form>
    </AuthCard>
  );
}
