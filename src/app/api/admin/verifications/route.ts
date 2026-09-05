import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, json, withAdmin } from "@/lib/api";
import { rejectSchema } from "@/lib/validators";
import { kickUserFromChat } from "@/lib/matchmaking";
import type { VerificationStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { user, response } = await withAdmin();
  if (!user) return response;

  const status = (req.nextUrl.searchParams.get("status") ||
    "PENDING") as VerificationStatus;

  const users = await prisma.user.findMany({
    where: { role: "USER", verificationStatus: status },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      nickname: true,
      email: true,
      gender: true,
      age: true,
      verificationStatus: true,
      verificationPhotoUrl: true,
      verificationRejectReason: true,
      createdAt: true,
    },
  });

  return json({ users });
}

export async function POST(req: NextRequest) {
  const { user, response } = await withAdmin();
  if (!user) return response;

  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const action = body?.action as "approve" | "reject" | undefined;
  if (!id || !action) return error("Missing id or action");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role === "ADMIN") return error("User not found", 404);

  if (action === "approve") {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        verificationStatus: "APPROVED",
        verificationRejectReason: null,
      },
    });
    return json({ ok: true, verificationStatus: updated.verificationStatus });
  }

  const parsed = rejectSchema.safeParse({ reason: body?.reason });
  if (!parsed.success) return error("A rejection reason is required");

  const updated = await prisma.user.update({
    where: { id },
    data: {
      verificationStatus: "REJECTED",
      verificationRejectReason: parsed.data.reason,
    },
  });
  await kickUserFromChat(id);
  return json({ ok: true, verificationStatus: updated.verificationStatus });
}
