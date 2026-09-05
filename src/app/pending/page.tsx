"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { BrandArt, Button, Card } from "@/components/ui";
import { WebcamCapture } from "@/components/WebcamCapture";
import { useI18n } from "@/lib/i18n";

type Me = {
  nickname: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  verificationRejectReason: string | null;
  status: string;
};

export default function PendingPage() {
  const { t, tError } = useI18n();
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.push("/login");
          return;
        }
        if (data.user.status === "BANNED") {
          router.push("/banned");
          return;
        }
        if (data.user.verificationStatus !== "REJECTED") {
          router.push("/chat");
          return;
        }
        setMe(data.user);
      });
  }, [router]);

  async function resubmit() {
    if (!photo) return;
    setPending(true);
    setError(null);
    const form = new FormData();
    form.set("verificationPhoto", photo, "face.jpg");
    const res = await fetch("/api/verification", { method: "POST", body: form });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(tError(data.error, "pending.couldNotResubmit"));
      return;
    }
    setPhoto(null);
    router.push("/chat");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (!me) return null;

  return (
    <div className="glow-bg min-h-full">
      <AppHeader
        right={
          <Button variant="ghost" onClick={logout}>
            {t("common.signOut")}
          </Button>
        }
      />
      <main className="mx-auto max-w-lg px-6 py-16">
        <Card className="space-y-5 text-center">
          <BrandArt
            src="/brand/shield.jpg"
            alt=""
            className="mx-auto h-20 w-20 rounded-2xl object-cover ring-1 ring-accent/20"
          />
          <h1 className="text-2xl font-semibold">{t("pending.title")}</h1>
          <p className="text-sm text-muted">{t("pending.body")}</p>
          {me.verificationRejectReason && (
            <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {me.verificationRejectReason}
            </p>
          )}
          <div className="space-y-4 text-left">
            <WebcamCapture onCapture={setPhoto} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button className="w-full" disabled={!photo || pending} onClick={resubmit}>
              {pending ? t("pending.sending") : t("pending.resubmit")}
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}
