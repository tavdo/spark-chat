"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, SparkMark } from "@/components/ui";
import { WebcamCapture } from "@/components/WebcamCapture";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [details, setDetails] = useState({
    nickname: "",
    email: "",
    password: "",
    gender: "FEMALE",
    age: "18",
  });

  function continueToPhoto(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (Number(details.age) < 18) {
      setError("You must be 18 or older");
      return;
    }
    setStep(2);
  }

  async function submit() {
    if (!photo) {
      setError("Capture a live face photo to continue");
      return;
    }
    setPending(true);
    setError(null);
    const form = new FormData();
    Object.entries(details).forEach(([k, v]) => form.set(k, v));
    form.set("verificationPhoto", photo, "face.jpg");
    const res = await fetch("/api/auth/register", { method: "POST", body: form });
    const data = await res.json();
    setPending(false);
    if (!res.ok) {
      setError(data.error || "Could not create account");
      return;
    }
    if (data.user?.verificationStatus === "APPROVED") {
      router.push("/chat");
    } else {
      router.push("/pending");
    }
  }

  return (
    <div className="glow-bg flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-lg space-y-6">
        <Link href="/">
          <SparkMark />
        </Link>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
            Step {step} of 2
          </p>
          <h1 className="mt-2 text-2xl font-semibold">
            {step === 1 ? "Create your account" : "Verify your face"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {step === 1
              ? "A few details first. You cannot join chat until an admin approves your photo."
              : "Look at the camera. File uploads are disabled to reduce fake photos."}
          </p>
        </div>

        {step === 1 ? (
          <form className="space-y-4" onSubmit={continueToPhoto}>
            <Field label="Nickname">
              <Input
                value={details.nickname}
                onChange={(e) => setDetails({ ...details, nickname: e.target.value })}
                minLength={2}
                maxLength={24}
                required
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={details.email}
                onChange={(e) => setDetails({ ...details, email: e.target.value })}
                required
              />
            </Field>
            <Field label="Password">
              <Input
                type="password"
                minLength={8}
                value={details.password}
                onChange={(e) => setDetails({ ...details, password: e.target.value })}
                required
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Gender">
                <select
                  className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm outline-none focus:border-accent"
                  value={details.gender}
                  onChange={(e) => setDetails({ ...details, gender: e.target.value })}
                >
                  <option value="FEMALE">Female</option>
                  <option value="MALE">Male</option>
                  <option value="OTHER">Other</option>
                </select>
              </Field>
              <Field label="Age">
                <Input
                  type="number"
                  min={18}
                  max={99}
                  value={details.age}
                  onChange={(e) => setDetails({ ...details, age: e.target.value })}
                  required
                />
              </Field>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button className="w-full">Continue to camera</Button>
          </form>
        ) : (
          <div className="space-y-4">
            <WebcamCapture onCapture={setPhoto} />
            {error && <p className="text-sm text-danger">{error}</p>}
            <div className="flex gap-3">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button className="flex-1" onClick={submit} disabled={pending || !photo}>
                {pending ? "Submitting..." : "Submit for review"}
              </Button>
            </div>
          </div>
        )}

        <p className="text-sm text-muted">
          Already verified?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
