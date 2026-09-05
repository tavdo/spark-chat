"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, ShieldCheck, UserMinus, Users } from "lucide-react";
import { Button, Card, StatusBadge } from "@/components/ui";
import { timeAgo } from "@/components/AdminNav";
import { genderKey, useI18n } from "@/lib/i18n";

type Stats = {
  pendingVerifications: number;
  openReports: number;
  bannedUsers: number;
  suspendedUsers: number;
  totalUsers: number;
  rejectedVerifications: number;
};

type PendingUser = {
  id: string;
  nickname: string;
  email: string;
  gender: string;
  age: number;
  verificationPhotoUrl: string | null;
  createdAt: string;
};

type Report = {
  id: string;
  reason: string;
  createdAt: string;
  reporter: { nickname: string };
  reported: { nickname: string; email: string };
};

export default function AdminDashboardPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingUser[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    void Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()),
      fetch("/api/admin/verifications?status=PENDING").then((r) => r.json()),
      fetch("/api/admin/reports?status=OPEN").then((r) => r.json()),
    ]).then(([s, v, rep]) => {
      setStats(s);
      setPending((v.users || []).slice(0, 4));
      setReports((rep.reports || []).slice(0, 4));
    });
  }, []);

  const cards = [
    {
      label: t("admin.pendingPhotos"),
      value: stats?.pendingVerifications ?? "—",
      href: "/admin/verifications",
      icon: ShieldCheck,
    },
    {
      label: t("admin.openReports"),
      value: stats?.openReports ?? "—",
      href: "/admin/reports",
      icon: Flag,
    },
    {
      label: t("admin.bannedSuspended"),
      value:
        stats == null
          ? "—"
          : `${stats.bannedUsers} / ${stats.suspendedUsers}`,
      href: "/admin/users",
      icon: UserMinus,
    },
    {
      label: t("admin.people"),
      value: stats?.totalUsers ?? "—",
      href: "/admin/users",
      icon: Users,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          {t("admin.moderation")}
        </p>
        <h1 className="mt-1 text-3xl font-semibold">{t("admin.desk")}</h1>
        <p className="mt-1 text-sm text-muted">{t("admin.deskBody")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="h-full transition hover:border-accent/40">
              <card.icon className="h-4 w-4 text-accent" />
              <p className="mt-4 text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-muted">{card.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("admin.verificationQueue")}</h2>
            <Link href="/admin/verifications" className="text-sm text-accent">
              {t("admin.openQueue")}
            </Link>
          </div>
          {pending.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">{t("admin.noPhotos")}</p>
            </Card>
          ) : (
            pending.map((u) => (
              <Card key={u.id} className="flex items-center gap-4 p-4">
                <div className="h-16 w-16 overflow-hidden rounded-2xl bg-black">
                  {u.verificationPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={u.verificationPhotoUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{u.nickname}</p>
                  <p className="truncate text-sm text-muted">
                    {t(genderKey(u.gender))} · {u.age} · {timeAgo(u.createdAt, t)}
                  </p>
                </div>
                <StatusBadge status="PENDING" />
              </Card>
            ))
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("admin.openReports")}</h2>
            <Link href="/admin/reports" className="text-sm text-accent">
              {t("admin.openQueue")}
            </Link>
          </div>
          {reports.length === 0 ? (
            <Card>
              <p className="text-sm text-muted">{t("admin.noOpenReports")}</p>
            </Card>
          ) : (
            reports.map((r) => (
              <Card key={r.id} className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-semibold">
                    {r.reporter.nickname} → {r.reported.nickname}
                  </p>
                  <StatusBadge status={r.reason} />
                </div>
                <p className="mt-1 text-sm text-muted">
                  {r.reported.email} · {timeAgo(r.createdAt, t)}
                </p>
              </Card>
            ))
          )}
        </section>
      </div>

      <Link href="/admin/verifications">
        <Button>{t("admin.reviewPending")}</Button>
      </Link>
    </div>
  );
}
