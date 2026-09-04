import { NextRequest } from "next/server";
import { error, json, withVerified } from "@/lib/api";
import {
  MAX_PHOTO_BYTES,
  MAX_VOICE_BYTES,
  PHOTO_MIME,
  VOICE_MIME,
} from "@/lib/constants";
import { extFromMime, mediaKey, mediaUrl, putObject } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const { user, response } = await withVerified();
  if (!user) return response;

  const form = await req.formData();
  const file = form.get("file");
  const kind = String(form.get("kind") || "photo");
  if (!(file instanceof File) || file.size === 0) {
    return error("No file uploaded");
  }

  if (kind === "voice") {
    const mime = file.type.split(";")[0];
    if (file.size > MAX_VOICE_BYTES) return error("Voice clip is too large");
    if (!VOICE_MIME.has(file.type) && !VOICE_MIME.has(mime)) {
      return error("Unsupported audio format");
    }
    const key = mediaKey("chat", extFromMime(mime, "webm"));
    await putObject(key, Buffer.from(await file.arrayBuffer()), mime);
    return json({ url: mediaUrl(key), type: "VOICE" });
  }

  if (file.size > MAX_PHOTO_BYTES) return error("Photo is too large");
  if (!PHOTO_MIME.has(file.type)) return error("Unsupported image format");
  const key = mediaKey("chat", extFromMime(file.type, "jpg"));
  await putObject(key, Buffer.from(await file.arrayBuffer()), file.type);
  return json({ url: mediaUrl(key), type: "PHOTO" });
}
