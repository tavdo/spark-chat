import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, json, withUser } from "@/lib/api";
import { profileSchema } from "@/lib/validators";
import { MAX_PHOTO_BYTES, PHOTO_MIME } from "@/lib/constants";
import { deleteObject, extFromMime, keyFromMediaUrl, mediaKey, mediaUrl, putObject } from "@/lib/storage";

export async function GET() {
  const { user, response } = await withUser();
  if (!user) return response;
  return json({ user });
}

export async function PATCH(req: NextRequest) {
  const { user, response } = await withUser();
  if (!user) return response;

  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => null);
    const parsed = profileSchema.safeParse(body);
    if (!parsed.success) return error("Invalid profile data");
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: parsed.data,
    });
    const { passwordHash: _, ...safe } = updated;
    return json({ user: safe });
  }

  const form = await req.formData().catch(() => null);
  if (!form) return error("Invalid profile data");

  const parsed = profileSchema.safeParse({
    nickname: form.get("nickname") || undefined,
    bio: form.get("bio"),
    interests: form.getAll("interests"),
  });
  if (!parsed.success) return error(parsed.error.issues[0]?.message || "Invalid profile");

  let avatarUrl = user.avatarUrl;
  const photo = form.get("avatar");
  if (photo instanceof File && photo.size > 0) {
    if (photo.size > MAX_PHOTO_BYTES) return error("Photo is too large");
    if (!PHOTO_MIME.has(photo.type)) return error("Invalid image type");
    const key = mediaKey("avatar", extFromMime(photo.type, "jpg"));
    await putObject(key, Buffer.from(await photo.arrayBuffer()), photo.type);
    const oldKey = user.avatarUrl ? keyFromMediaUrl(user.avatarUrl) : null;
    if (oldKey && !oldKey.startsWith("verification/")) await deleteObject(oldKey);
    avatarUrl = mediaUrl(key);
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...parsed.data,
      avatarUrl,
    },
  });
  const { passwordHash: _, ...safe } = updated;
  return json({ user: safe });
}
