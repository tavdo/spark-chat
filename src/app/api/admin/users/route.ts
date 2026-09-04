import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, json, withAdmin } from "@/lib/api";

export async function GET(req: NextRequest) {
  const { user, response } = await withAdmin();
  if (!user) return response;

  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { nickname: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : { role: "USER" },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      nickname: true,
      email: true,
      gender: true,
      age: true,
      verificationStatus: true,
      status: true,
      warningCount: true,
      suspendUntil: true,
      bannedAt: true,
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
  const action = body?.action as "ban" | "unban" | "warn" | "suspend" | undefined;
  if (!id || !action) return error("Missing id or action");

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target || target.role === "ADMIN") return error("User not found", 404);

  const now = new Date();
  const data =
    action === "ban"
      ? {
          status: "BANNED" as const,
          bannedAt: now,
          banReason: (body?.note as string) || "Banned by admin",
        }
      : action === "unban"
        ? {
            status: "ACTIVE" as const,
            bannedAt: null,
            banReason: null,
            suspendUntil: null,
          }
        : action === "warn"
          ? {
              status: "WARNED" as const,
              warningCount: { increment: 1 },
              lastWarningAt: now,
            }
          : {
              status: "SUSPENDED" as const,
              suspendUntil: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
            };

  const updated = await prisma.user.update({ where: { id }, data });
  const { passwordHash: _, ...safe } = updated;
  return json({ user: safe });
}
