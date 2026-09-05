"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AuthButton, AuthCard, AuthInput } from "@/components/AuthCard";
import { useI18n } from "@/lib/i18n";

export default function AdminLoginPage() {
  const { t, tError } = useI18n();
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
      setError(tError(data.error, "auth.couldNotSignIn"));
      return;
    }
    if (data.user?.role !== "ADMIN") {
      setError(t("common.adminOnly"));
      return;
    }
    router.push("/admin");
  }

  return (
    <AuthCard
      mode="admin"
      title={t("auth.adminWelcome")}
      subtitle={t("auth.adminSubtitle")}
      formTitle={t("auth.adminFormTitle")}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthInput
          name="email"
          type="email"
          required
          defaultValue="admin@spark.local"
          placeholder={t("common.email")}
          icon={<Mail className="h-4 w-4" />}
        />
        <AuthInput
          name="password"
          type="password"
          required
          defaultValue="changeme-admin"
          placeholder={t("common.password")}
          icon={<Lock className="h-4 w-4" />}
        />
        {error && <p className="text-center text-sm text-rose-500">{error}</p>}
        <div className="pt-2">
          <AuthButton disabled={pending}>
            {pending ? t("auth.signingIn") : t("auth.loginBtn")}
          </AuthButton>
        </div>
      </form>
    </AuthCard>
  );
}
