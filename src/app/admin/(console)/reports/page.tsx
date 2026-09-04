"use client";

import { useEffect, useState } from "react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { FilterTabs, timeAgo } from "@/components/AdminNav";

type Report = {
  id: string;
  reason: string;
  details: string | null;
  status: string;
  action: string | null;
  chatContext: Array<{
    senderId: string;
    type: string;
    content: string;
    createdAt: string;
  }> | null;
  createdAt: string;
  reporter: { nickname: string; email: string };
  reported: { id: string; nickname: string; email: string; status: string };
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState("OPEN");
  const [busy, setBusy] = useState<string | null>(null);

  async function load(status = filter) {
    const res = await fetch(`/api/admin/reports?status=${status}`);
    const data = await res.json();
    setReports(data.reports || []);
  }

  useEffect(() => {
    void load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function act(id: string, action: string) {
    setBusy(id);
    await fetch("/api/admin/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(null);
    void load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted">
            Snapshots of recent messages are kept so you can act without storing full history.
          </p>
        </div>
        <FilterTabs
          value={filter}
          onChange={setFilter}
          options={[
            { value: "OPEN", label: "Open" },
            { value: "ACTIONED", label: "Actioned" },
            { value: "DISMISSED", label: "Dismissed" },
          ]}
        />
      </div>
      <div className="space-y-4">
        {reports.length === 0 && (
          <Card>
            <p className="text-sm text-muted">No reports in this view.</p>
          </Card>
        )}
        {reports.map((r) => (
          <Card key={r.id} className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">
                  {r.reporter.nickname} reported {r.reported.nickname}
                </p>
                <p className="text-sm text-muted">
                  {r.reporter.email} → {r.reported.email} · {timeAgo(r.createdAt)}
                </p>
              </div>
              <div className="flex gap-2">
                <StatusBadge status={r.reason} />
                <StatusBadge status={r.status} />
              </div>
            </div>
            {r.details && (
              <p className="rounded-2xl bg-surface-2 px-3 py-2 text-sm">{r.details}</p>
            )}
            {r.chatContext && r.chatContext.length > 0 && (
              <div className="max-h-64 space-y-2 overflow-y-auto rounded-2xl bg-bg p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                  Chat snapshot
                </p>
                {r.chatContext.map((m, i) => (
                  <div key={i} className="text-sm">
                    <span className="mr-2 text-[11px] font-semibold uppercase text-accent">
                      {m.type}
                    </span>
                    {m.type === "PHOTO" || m.type === "GIF" ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.content}
                        alt=""
                        className="mt-1 max-h-32 rounded-xl object-cover"
                      />
                    ) : (
                      <span className="text-muted">{m.content}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
            {r.status === "OPEN" && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="subtle"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "WARN")}
                >
                  Warn
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "SUSPEND")}
                >
                  Suspend 7d
                </Button>
                <Button
                  variant="danger"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "BAN")}
                >
                  Ban
                </Button>
                <Button
                  variant="ghost"
                  disabled={busy === r.id}
                  onClick={() => act(r.id, "DISMISS")}
                >
                  Dismiss
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
