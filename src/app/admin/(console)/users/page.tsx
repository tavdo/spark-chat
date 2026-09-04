"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, StatusBadge } from "@/components/ui";
import { FilterTabs } from "@/components/AdminNav";
import { formatGender } from "@/lib/utils";

type User = {
  id: string;
  nickname: string;
  email: string;
  gender: string;
  age: number;
  verificationStatus: string;
  status: string;
  warningCount: number;
};

export default function AdminUsersPage() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [busy, setBusy] = useState<string | null>(null);

  async function load(query = q) {
    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setUsers(data.users || []);
  }

  useEffect(() => {
    void load("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: string, action: "ban" | "unban" | "warn" | "suspend") {
    setBusy(id);
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action }),
    });
    setBusy(null);
    void load();
  }

  const visible = users.filter((u) => {
    if (filter === "ALL") return true;
    if (filter === "PENDING") return u.verificationStatus === "PENDING";
    return u.status === filter;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted">
          Search, check verification, warn, suspend, ban, or restore access.
        </p>
      </div>
      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search nickname or email"
        />
        <Button>Search</Button>
      </form>
      <FilterTabs
        value={filter}
        onChange={setFilter}
        options={[
          { value: "ALL", label: "All" },
          { value: "PENDING", label: "Pending verify" },
          { value: "WARNED", label: "Warned" },
          { value: "SUSPENDED", label: "Suspended" },
          { value: "BANNED", label: "Banned" },
        ]}
      />
      <div className="space-y-3">
        {visible.length === 0 && (
          <Card>
            <p className="text-sm text-muted">No users match this view.</p>
          </Card>
        )}
        {visible.map((u) => (
          <Card key={u.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{u.nickname}</p>
              <p className="text-sm text-muted">
                {u.email} · {formatGender(u.gender)} · {u.age} · warnings {u.warningCount}
              </p>
              <div className="mt-2 flex gap-2">
                <StatusBadge status={u.verificationStatus} />
                <StatusBadge status={u.status} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="subtle"
                disabled={busy === u.id}
                onClick={() => act(u.id, "warn")}
              >
                Warn
              </Button>
              <Button
                variant="ghost"
                disabled={busy === u.id}
                onClick={() => act(u.id, "suspend")}
              >
                Suspend
              </Button>
              {u.status === "BANNED" ? (
                <Button disabled={busy === u.id} onClick={() => act(u.id, "unban")}>
                  Unban
                </Button>
              ) : (
                <Button
                  variant="danger"
                  disabled={busy === u.id}
                  onClick={() => act(u.id, "ban")}
                >
                  Ban
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
