"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Mail } from "lucide-react";
import { AuthButton, AuthCard, AuthInput } from "@/components/AuthCard";
import { useI18n } from "@/lib/i18n";

export default function LoginPage() {
  const { t, tError } = useI18n();
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
        setError(tError(data.error, "auth.couldNotSignIn"));
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
      setError(t("common.networkError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      mode="login"
      title={t("auth.welcome")}
      subtitle={t("auth.loginSubtitle")}
      formTitle={t("auth.loginFormTitle")}
    >
      <form className="space-y-4" onSubmit={onSubmit}>
        <AuthInput
          name="email"
          type="email"
          required
          placeholder={t("common.email")}
          autoComplete={remember ? "email" : "off"}
          icon={<Mail className="h-4 w-4" />}
        />
        <AuthInput
          name="password"
          type="password"
          required
          placeholder={t("common.password")}
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
            {t("common.remember")}
          </label>
        </div>
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
