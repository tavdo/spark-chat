"use client";

import { useEffect, useState } from "react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { FilterTabs, timeAgo } from "@/components/AdminNav";
import { formatGender } from "@/lib/utils";

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
      setError((e) => ({ ...e, [id]: data.error || "Could not update" }));
      return;
    }
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Verification queue</h1>
          <p className="text-sm text-muted">
            Users can chat while pending. Rejecting a photo blocks them from chat immediately.
          </p>
        </div>
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "PENDING", label: "Pending" },
            { value: "APPROVED", label: "Approved" },
            { value: "REJECTED", label: "Rejected" },
          ]}
        />
      </div>
      <div className="grid gap-4">
        {users.length === 0 && (
          <Card>
            <p className="text-sm text-muted">Nothing in this queue.</p>
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
                  No photo
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
                Stated gender: {formatGender(u.gender)} · Age {u.age} · submitted{" "}
                {timeAgo(u.createdAt)}
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
                    placeholder="Rejection reason (required to reject)"
                    className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm"
                  />
                  {error[u.id] && (
                    <p className="text-sm text-danger">{error[u.id]}</p>
                  )}
                  <div className="flex gap-2">
                    <Button onClick={() => act(u.id, "approve")} disabled={busy === u.id}>
                      Approve
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => act(u.id, "reject")}
                      disabled={busy === u.id}
                    >
                      Reject
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
