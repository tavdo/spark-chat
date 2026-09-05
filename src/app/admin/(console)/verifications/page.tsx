"use client";

import { useEffect, useState } from "react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { FilterTabs, timeAgo } from "@/components/AdminNav";
import { genderKey, useI18n } from "@/lib/i18n";

type Row = {
  id: string;
  nickname: string;
  email: string;
  gender: string;
  age: number;
  verificationStatus: string;
  verificationPhotoUrl: string | null;
  verificationRejectReason: string | null;
  createdAt: string;
};

export default function AdminVerificationPage() {
  const { t, tError } = useI18n();
  const [users, setUsers] = useState<Row[]>([]);
  const [reason, setReason] = useState<Record<string, string>>({});
  const [error, setError] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("PENDING");
  const [busy, setBusy] = useState<string | null>(null);

  async function load(status = filter) {
    const res = await fetch(`/api/admin/verifications?status=${status}`);
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function act(id: string, action: "approve" | "reject") {
    setError((e) => ({ ...e, [id]: "" }));
    setBusy(id);
    const res = await fetch("/api/admin/verifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action, reason: reason[id] }),
    });
    const data = await res.json();
    setBusy(null);
    if (!res.ok) {
      setError((e) => ({ ...e, [id]: tError(data.error, "admin.couldNotUpdate") }));
      return;
    }
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("admin.verificationQueue")}</h1>
          <p className="text-sm text-muted">{t("admin.verifBody")}</p>
        </div>
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "PENDING", label: t("status.PENDING") },
            { value: "APPROVED", label: t("status.APPROVED") },
            { value: "REJECTED", label: t("status.REJECTED") },
          ]}
        />
      </div>
      <div className="grid gap-4">
        {users.length === 0 && (
          <Card>
            <p className="text-sm text-muted">{t("admin.nothingQueue")}</p>
          </Card>
        )}
        {users.map((u) => (
          <Card key={u.id} className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div className="overflow-hidden rounded-2xl bg-black">
              {u.verificationPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={u.verificationPhotoUrl}
                  alt={`${u.nickname} verification`}
                  className="h-64 w-full object-cover"
                />
              ) : (
                <div className="grid h-64 place-items-center text-sm text-muted">
                  {t("admin.noPhoto")}
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">{u.nickname}</h2>
                <StatusBadge status={u.verificationStatus} />
              </div>
              <p className="text-sm text-muted">
                {u.email}
                <br />
                {t("admin.statedGender", {
                  gender: t(genderKey(u.gender)),
                  age: u.age,
                  time: timeAgo(u.createdAt, t),
                })}
              </p>
              {u.verificationRejectReason && (
                <p className="rounded-2xl bg-danger/10 px-3 py-2 text-sm text-danger">
                  {u.verificationRejectReason}
                </p>
              )}
              {u.verificationStatus === "PENDING" && (
                <>
                  <input
                    value={reason[u.id] || ""}
                    onChange={(e) =>
                      setReason((r) => ({ ...r, [u.id]: e.target.value }))
                    }
                    placeholder={t("admin.rejectReason")}
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
                  />
                  {error[u.id] && (
                    <p className="text-sm text-danger">{error[u.id]}</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => act(u.id, "approve")} disabled={busy === u.id}>
                      {t("admin.approve")}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => act(u.id, "reject")}
                      disabled={busy === u.id}
                    >
                      {t("admin.reject")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
