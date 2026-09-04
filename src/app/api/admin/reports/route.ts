import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, json, withAdmin } from "@/lib/api";
import { moderationSchema } from "@/lib/validators";
import type { ReportStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { user, response } = await withAdmin();
  if (!user) return response;

  const status = (req.nextUrl.searchParams.get("status") || "OPEN") as ReportStatus;
  const reports = await prisma.report.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    include: {
      reporter: {
        select: { id: true, nickname: true, email: true },
      },
      reported: {
        select: {
          id: true,
          nickname: true,
          email: true,
          status: true,
          verificationStatus: true,
        },
      },
    },
    take: 100,
  });

  return json({ reports });
}

export async function POST(req: NextRequest) {
  const { user, response } = await withAdmin();
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const parsed = moderationSchema.safeParse(body);
  if (!id || !parsed.success) return error("Invalid moderation payload");

  const report = await prisma.report.findUnique({ where: { id } });
  if (!report) return error("Report not found", 404);

  const action = parsed.data.action;
  const now = new Date();

  if (action !== "DISMISS") {
    if (action === "WARN") {
      await prisma.user.update({
        where: { id: report.reportedId },
        data: {
          status: "WARNED",
          warningCount: { increment: 1 },
          lastWarningAt: now,
        },
      });
    } else if (action === "SUSPEND") {
      await prisma.user.update({
        where: { id: report.reportedId },
        data: {
          status: "SUSPENDED",
          suspendUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } else if (action === "BAN") {
      await prisma.user.update({
        where: { id: report.reportedId },
        data: {
          status: "BANNED",
          bannedAt: now,
          banReason: parsed.data.note || report.reason,
        },
      });
    }
  }

  const updated = await prisma.report.update({
    where: { id },
    data: {
      status: action === "DISMISS" ? "DISMISSED" : "ACTIONED",
      action,
      actionNote: parsed.data.note,
      reviewedAt: now,
      reviewedById: user.id,
    },
  });

  return json({ ok: true, report: updated });
}
