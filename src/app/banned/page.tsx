"use client";

import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Button, Card } from "@/components/ui";

export default function BannedPage() {
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
          <h1 className="text-2xl font-semibold">Account banned</h1>
          <p className="text-sm text-muted">
            This account can no longer use Spark. If you think this is a mistake, contact support.
          </p>
          <Button onClick={logout}>Sign out</Button>
        </Card>
      </main>
    </div>
  );
}
