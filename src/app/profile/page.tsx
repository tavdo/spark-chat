"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { Button, Card, Field, Input, StatusBadge } from "@/components/ui";
import { WebcamCapture } from "@/components/WebcamCapture";
import { INTEREST_OPTIONS } from "@/lib/constants";
import { genderKey, interestKey, useI18n } from "@/lib/i18n";
import { initials } from "@/lib/utils";
import { BadgeCheck } from "lucide-react";

type User = {
  nickname: string;
  email: string;
  gender: string;
  age: number;
  bio: string | null;
  interests: string[];
  avatarUrl: string | null;
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  verificationRejectReason: string | null;
  status: string;
};

export default function ProfilePage() {
  const { t, tError } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [bio, setBio] = useState("");
  const [nickname, setNickname] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [saving, setSaving] = useState(false);

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
        setUser(data.user);
        setBio(data.user.bio || "");
        setNickname(data.user.nickname);
        setInterests(data.user.interests || []);
      });
  }, [router]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname, bio, interests }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage(tError(data.error, "profile.couldNotSave"));
      return;
    }
    setUser(data.user);
    setMessage(t("profile.saved"));
  }

  async function resubmit() {
    if (!photo) return;
    const form = new FormData();
    form.set("verificationPhoto", photo, "face.jpg");
    const res = await fetch("/api/verification", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok) {
      setMessage(tError(data.error, "pending.couldNotResubmit"));
      return;
    }
    setUser((u) =>
      u ? { ...u, verificationStatus: "PENDING", verificationRejectReason: null } : u
    );
    setMessage(t("profile.photoSubmitted"));
    router.push("/chat");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
  }

  if (!user) return null;

  return (
    <div className="glow-bg min-h-full">
      <AppHeader
        right={
          <>
            {user.verificationStatus !== "REJECTED" && (
              <Link href="/chat">
                <Button>{t("common.chat")}</Button>
              </Link>
            )}
            <Button variant="ghost" onClick={logout}>
              {t("common.signOut")}
            </Button>
          </>
        }
      />
      <main className="mx-auto grid max-w-4xl gap-6 px-6 py-10 md:grid-cols-[240px_1fr]">
        <Card className="h-fit space-y-4 text-center">
          <div className="mx-auto grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-surface-2 text-2xl font-semibold">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                initials(user.nickname)
              )}
          </div>
          <div>
            <div className="flex items-center justify-center gap-1.5 text-lg font-semibold">
              {user.nickname}
              {user.verificationStatus === "APPROVED" && (
                <BadgeCheck className="h-5 w-5 text-accent" />
              )}
            </div>
            <p className="text-sm text-muted">
              {t(genderKey(user.gender))} · {user.age}
            </p>
          </div>
          <StatusBadge status={user.verificationStatus} />
        </Card>

        <div className="space-y-6">
          {user.verificationStatus !== "APPROVED" && (
            <Card className="space-y-3">
              <h2 className="text-lg font-semibold">{t("profile.verification")}</h2>
              {user.verificationStatus === "PENDING" && (
                <p className="text-sm text-muted">{t("profile.pendingNote")}</p>
              )}
              {user.verificationStatus === "REJECTED" && (
                <>
                  <p className="text-sm text-danger">
                    {user.verificationRejectReason || t("profile.rejectedDefault")}
                  </p>
                  <WebcamCapture onCapture={setPhoto} />
                  <Button onClick={resubmit} disabled={!photo}>
                    {t("profile.resubmit")}
                  </Button>
                </>
              )}
            </Card>
          )}

          <Card>
            <form className="space-y-4" onSubmit={save}>
              <h2 className="text-lg font-semibold">{t("profile.edit")}</h2>
              <Field label={t("common.nickname")}>
                <Input value={nickname} onChange={(e) => setNickname(e.target.value)} />
              </Field>
              <Field label={t("common.bio")}>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={280}
                  rows={4}
                  className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                />
              </Field>
              <div>
                <p className="mb-2 text-sm text-muted">{t("common.interests")}</p>
                <div className="flex flex-wrap gap-2">
                  {INTEREST_OPTIONS.map((tag) => {
                    const on = interests.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() =>
                          setInterests((curr) =>
                            on ? curr.filter((t) => t !== tag) : [...curr, tag]
                          )
                        }
                        className={`rounded-full px-3 py-1 text-sm ${
                          on ? "bg-accent-strong text-white" : "bg-surface-2 text-muted"
                        }`}
                      >
                        {interestKey(tag) ? t(interestKey(tag)!) : tag}
                      </button>
                    );
                  })}
                </div>
              </div>
              {message && <p className="text-sm text-accent">{message}</p>}
              <Button disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
            </form>
          </Card>
        </div>
      </main>
    </div>
  );
}
