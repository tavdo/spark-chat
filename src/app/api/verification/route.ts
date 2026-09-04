import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { error, json, withUser } from "@/lib/api";
import { MAX_PHOTO_BYTES, PHOTO_MIME } from "@/lib/constants";
import { deleteObject, extFromMime, keyFromMediaUrl, mediaKey, mediaUrl, putObject } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const { user, response } = await withUser();
  if (!user) return response;
  if (user.verificationStatus === "APPROVED") {
    return error("Account is already verified");
  }

  const form = await req.formData();
  const photo = form.get("verificationPhoto");
  if (!(photo instanceof File) || photo.size === 0) {
    return error("A live face photo is required");
  }
  if (photo.size > MAX_PHOTO_BYTES) return error("Photo is too large");
  if (!PHOTO_MIME.has(photo.type)) return error("Invalid image type");

  const oldKey = user.verificationPhotoUrl
    ? keyFromMediaUrl(user.verificationPhotoUrl)
    : null;
  const key = mediaKey("verification", extFromMime(photo.type, "jpg"));
  await putObject(key, Buffer.from(await photo.arrayBuffer()), photo.type);
  if (oldKey) await deleteObject(oldKey);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      verificationPhotoUrl: mediaUrl(key),
      verificationStatus: "PENDING",
      verificationRejectReason: null,
      avatarUrl: user.avatarUrl || mediaUrl(key),
    },
  });

  return json({
    ok: true,
    verificationStatus: updated.verificationStatus,
  });
}
