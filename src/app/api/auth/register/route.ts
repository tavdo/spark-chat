import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword, setSession } from "@/lib/auth";
import { error, json, rateLimit } from "@/lib/api";
import { registerSchema } from "@/lib/validators";
import { MAX_PHOTO_BYTES, PHOTO_MIME } from "@/lib/constants";
import { extFromMime, mediaKey, mediaUrl, putObject } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  if (!rateLimit(`register:${ip}`, 8, 60_000)) {
    return error("Too many attempts, try again shortly", 429);
  }

  const form = await req.formData();
  const parsed = registerSchema.safeParse({
    nickname: form.get("nickname"),
    email: form.get("email"),
    password: form.get("password"),
    gender: form.get("gender"),
    age: form.get("age"),
  });
  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message || "Invalid details");
  }

  const photo = form.get("verificationPhoto");
  if (!(photo instanceof File) || photo.size === 0) {
    return error("A live face photo is required for verification");
  }
  if (photo.size > MAX_PHOTO_BYTES) {
    return error("Verification photo is too large (max 8MB)");
  }
  if (!PHOTO_MIME.has(photo.type)) {
    return error("Verification photo must be JPEG, PNG, or WebP");
  }

  const existing = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });
  if (existing) return error("An account with that email already exists", 409);

  const key = mediaKey("verification", extFromMime(photo.type, "jpg"));
  await putObject(key, Buffer.from(await photo.arrayBuffer()), photo.type);

  const autoApprove = process.env.DEV_AUTO_APPROVE === "true";
  const user = await prisma.user.create({
    data: {
      nickname: parsed.data.nickname,
      email: parsed.data.email.toLowerCase(),
      passwordHash: await hashPassword(parsed.data.password),
      gender: parsed.data.gender,
      age: parsed.data.age,
      verificationPhotoUrl: mediaUrl(key),
      verificationStatus: autoApprove ? "APPROVED" : "PENDING",
    },
  });

  await setSession({ id: user.id, role: user.role });
  return json({
    ok: true,
    user: {
      id: user.id,
      nickname: user.nickname,
      verificationStatus: user.verificationStatus,
    },
  });
}
