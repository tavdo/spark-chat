"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Button, Card } from "@/components/ui";
import { WebcamCapture } from "@/components/WebcamCapture";
import { ShieldAlert, ShieldQuestion } from "lucide-react";

type Me = {
  nickname: string;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  verificationRejectReason: string | null;
  status: string;
};

export default function PendingPage() {
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
        if (data.user.verificationStatus === "APPROVED") {
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
      setError(data.error || "Could not resubmit");
      return;
    }
    setMe((m) => (m ? { ...m, verificationStatus: "PENDING", verificationRejectReason: null } : m));
    setPhoto(null);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (!me) return null;

  const rejected = me.verificationStatus === "REJECTED";

  return (
    <div className="glow-bg min-h-full">
      <AppHeader
        right={
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
        }
      />
      <main className="mx-auto max-w-lg px-6 py-16">
        <Card className="space-y-5 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent/15 text-accent">
            {rejected ? <ShieldAlert /> : <ShieldQuestion />}
          </div>
          <h1 className="text-2xl font-semibold">
            {rejected ? "Verification was rejected" : "Your account is under review"}
          </h1>
          <p className="text-sm text-muted">
            {rejected
              ? "You cannot enter chat until a new photo is approved."
              : `Thanks ${me.nickname}. An admin will check your face photo and stated gender. This usually does not take long.`}
          </p>
          {rejected && me.verificationRejectReason && (
            <p className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
              {me.verificationRejectReason}
            </p>
          )}
          {rejected && (
            <div className="space-y-4 text-left">
              <WebcamCapture onCapture={setPhoto} />
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button className="w-full" disabled={!photo || pending} onClick={resubmit}>
                {pending ? "Sending..." : "Resubmit photo"}
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}
