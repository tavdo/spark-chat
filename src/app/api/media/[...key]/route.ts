import { Readable } from "node:stream";
import { getCurrentUser } from "@/lib/auth";
import { error } from "@/lib/api";
import { getObjectStream } from "@/lib/storage";

function guessMime(key: string) {
  const ext = key.split(".").pop()?.toLowerCase();
  const map: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
    webm: "audio/webm",
    ogg: "audio/ogg",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    wav: "audio/wav",
  };
  return map[ext || ""] || "application/octet-stream";
}

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ key: string[] }> }
) {
  const user = await getCurrentUser();
  if (!user || user.status === "BANNED") return error("Unauthorized", 401);

  const { key: parts } = await ctx.params;
  const key = parts.join("/");
  if (!key || key.includes("..")) return error("Not found", 404);

  const isVerification = key.startsWith("verification/");
  if (isVerification && user.role !== "ADMIN") {
    return error("Forbidden", 403);
  }

  try {
    const obj = await getObjectStream(key);
    if (!obj) return error("Not found", 404);
    const webStream = Readable.toWeb(obj.stream) as ReadableStream;
    return new Response(webStream, {
      headers: {
        "Content-Type": obj.contentType || guessMime(key),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return error("Not found", 404);
  }
}
