"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Lock, Mail, UserRound, VenusAndMars } from "lucide-react";
import { AuthButton, AuthCard, AuthInput, AuthSelect } from "@/components/AuthCard";
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
    try {
      const form = new FormData();
      Object.entries(details).forEach(([k, v]) => form.set(k, v));
      form.set("verificationPhoto", photo, "face.jpg");
      const res = await fetch("/api/auth/register", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not create account");
        return;
      }
      router.push("/chat");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      wide
      mode="register"
      title={step === 1 ? "Welcome to Spark" : "One live selfie"}
      subtitle={
        step === 1
          ? "Create an account, send a selfie, and start chatting right away."
          : "Look at the camera. You can chat immediately after this."
      }
      formTitle={step === 1 ? "CREATE ACCOUNT" : "SELFIE"}
    >
      {step === 1 ? (
        <form className="space-y-3.5" onSubmit={continueToPhoto}>
          <AuthInput
            placeholder="Nickname"
            value={details.nickname}
            onChange={(e) => setDetails({ ...details, nickname: e.target.value })}
            minLength={2}
            maxLength={24}
            required
            icon={<UserRound className="h-4 w-4" />}
          />
          <AuthInput
            type="email"
            placeholder="Email"
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            required
            icon={<Mail className="h-4 w-4" />}
          />
          <AuthInput
            type="password"
            placeholder="Password"
            minLength={8}
            value={details.password}
            onChange={(e) => setDetails({ ...details, password: e.target.value })}
            required
            icon={<Lock className="h-4 w-4" />}
          />
          <div className="grid grid-cols-2 gap-3">
            <AuthSelect
              value={details.gender}
              onChange={(e) => setDetails({ ...details, gender: e.target.value })}
              icon={<VenusAndMars className="h-4 w-4" />}
            >
              <option value="FEMALE">Female</option>
              <option value="MALE">Male</option>
              <option value="OTHER">Other</option>
            </AuthSelect>
            <AuthInput
              type="number"
              min={18}
              max={99}
              placeholder="Age"
              value={details.age}
              onChange={(e) => setDetails({ ...details, age: e.target.value })}
              required
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
          {error && <p className="text-center text-sm text-rose-500">{error}</p>}
          <div className="pt-2">
            <AuthButton>CONTINUE</AuthButton>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <WebcamCapture onCapture={setPhoto} />
          {error && <p className="text-center text-sm text-rose-500">{error}</p>}
          <div className="flex justify-center gap-3 pt-1">
            <AuthButton type="button" className="bg-transparent px-6 text-[#7c3aed] ring-1 ring-[#7c3aed]" onClick={() => setStep(1)}>
              BACK
            </AuthButton>
            <AuthButton type="button" onClick={submit} disabled={pending || !photo}>
              {pending ? "SUBMITTING..." : "JOIN CHAT"}
            </AuthButton>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
