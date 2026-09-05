"use client";

import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n";
import { Button } from "./ui";

export function AdminSignOut() {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      className="w-full"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.push("/admin/login");
      }}
    >
      {t("common.signOut")}
    </Button>
  );
}
