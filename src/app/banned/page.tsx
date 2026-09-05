"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Button, Card } from "@/components/ui";
import { useI18n } from "@/lib/i18n";

export default function BannedPage() {
  const { t } = useI18n();
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }
  return (
    <div className="glow-bg min-h-full">
      <AppHeader />
      <main className="mx-auto max-w-lg px-6 py-16">
        <Card className="space-y-4 text-center">
          <h1 className="text-2xl font-semibold">{t("banned.title")}</h1>
          <p className="text-sm text-muted">{t("banned.body")}</p>
          <Button onClick={logout}>{t("common.signOut")}</Button>
        </Card>
      </main>
    </div>
  );
}
