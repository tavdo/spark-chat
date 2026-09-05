"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Lock, Mail, UserRound, VenusAndMars } from "lucide-react";
import { AuthButton, AuthCard, AuthInput, AuthSelect } from "@/components/AuthCard";
import { WebcamCapture } from "@/components/WebcamCapture";
import { useI18n } from "@/lib/i18n";

export default function RegisterPage() {
  const { t, tError } = useI18n();
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
      setError(t("auth.mustBe18"));
      return;
    }
    setStep(2);
  }

  async function submit() {
    if (!photo) {
      setError(t("auth.needPhoto"));
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
        setError(tError(data.error, "auth.couldNotCreate"));
        return;
      }
      router.push("/chat");
    } catch {
      setError(t("common.networkError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthCard
      wide
      mode="register"
      title={step === 1 ? t("auth.welcome") : t("auth.selfieTitle")}
      subtitle={step === 1 ? t("auth.registerSubtitle") : t("auth.selfieSubtitle")}
      formTitle={step === 1 ? t("auth.registerFormTitle") : t("auth.selfieFormTitle")}
    >
      {step === 1 ? (
        <form className="space-y-3.5" onSubmit={continueToPhoto}>
          <AuthInput
            placeholder={t("common.nickname")}
            value={details.nickname}
            onChange={(e) => setDetails({ ...details, nickname: e.target.value })}
            minLength={2}
            maxLength={24}
            required
            icon={<UserRound className="h-4 w-4" />}
          />
          <AuthInput
            type="email"
            placeholder={t("common.email")}
            value={details.email}
            onChange={(e) => setDetails({ ...details, email: e.target.value })}
            required
            icon={<Mail className="h-4 w-4" />}
          />
          <AuthInput
            type="password"
            placeholder={t("common.password")}
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
              <option value="FEMALE">{t("gender.female")}</option>
              <option value="MALE">{t("gender.male")}</option>
              <option value="OTHER">{t("gender.other")}</option>
            </AuthSelect>
            <AuthInput
              type="number"
              min={18}
              max={99}
              placeholder={t("common.age")}
              value={details.age}
              onChange={(e) => setDetails({ ...details, age: e.target.value })}
              required
              icon={<Calendar className="h-4 w-4" />}
            />
          </div>
          {error && <p className="text-center text-sm text-rose-500">{error}</p>}
          <div className="pt-2">
            <AuthButton>{t("common.continue")}</AuthButton>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <WebcamCapture onCapture={setPhoto} />
          {error && <p className="text-center text-sm text-rose-500">{error}</p>}
          <div className="flex justify-center gap-3 pt-1">
            <AuthButton type="button" className="bg-transparent px-6 text-[#7c3aed] ring-1 ring-[#7c3aed]" onClick={() => setStep(1)}>
              {t("common.back")}
            </AuthButton>
            <AuthButton type="button" onClick={submit} disabled={pending || !photo}>
              {pending ? t("auth.submitting") : t("auth.joinChat")}
            </AuthButton>
          </div>
        </div>
      )}
    </AuthCard>
  );
}
