import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkPassword, setSession } from "@/lib/auth";
import { error, json, rateLimit } from "@/lib/api";
import { loginSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`login:${ip}`, 12, 60_000)) {
    return error("Too many attempts, try again shortly", 429);
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return error("Invalid email or password");

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (!user || !(await checkPassword(parsed.data.password, user.passwordHash))) {
    return error("Invalid email or password", 401);
  }
  if (user.status === "BANNED") {
    return error("This account has been banned", 403);
  }

  await setSession({ id: user.id, role: user.role });
  return json({
    ok: true,
    user: {
      id: user.id,
      nickname: user.nickname,
      role: user.role,
      verificationStatus: user.verificationStatus,
      status: user.status,
    },
  });
}
