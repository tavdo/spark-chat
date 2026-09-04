import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Readable } from "node:stream";

const ROOT = path.join(process.cwd(), "uploads");

function useS3() {
  return Boolean(
    process.env.S3_ENDPOINT &&
      process.env.S3_BUCKET &&
      process.env.S3_ACCESS_KEY &&
      process.env.S3_SECRET_KEY
  );
}

function s3() {
  return new S3Client({
    region: process.env.S3_REGION || "auto",
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
  });
}

export function mediaKey(kind: string, ext: string) {
  return `${kind}/${randomUUID()}.${ext}`;
}

export function extFromMime(mime: string, fallback: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "audio/webm": "webm",
    "audio/ogg": "ogg",
    "audio/mp4": "m4a",
    "audio/mpeg": "mp3",
    "audio/wav": "wav",
  };
  return map[mime] || fallback;
}

export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
) {
  if (useS3()) {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: body,
        ContentType: contentType,
      })
    );
    return key;
  }

  const full = path.join(ROOT, key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, body);
  return key;
}

export async function deleteObject(key: string) {
  try {
    if (useS3()) {
      await s3().send(
        new DeleteObjectCommand({
          Bucket: process.env.S3_BUCKET,
          Key: key,
        })
      );
      return;
    }
    await unlink(path.join(ROOT, key));
  } catch {
    // already gone
  }
}

export async function getObjectStream(key: string) {
  if (useS3()) {
    const res = await s3().send(
      new GetObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: key,
      })
    );
    const body = res.Body;
    if (!body) return null;
    return { stream: body as Readable, contentType: res.ContentType };
  }

  const full = path.join(ROOT, key);
  return {
    stream: createReadStream(full),
    contentType: undefined as string | undefined,
  };
}

export function mediaUrl(key: string) {
  return `/api/media/${key}`;
}

export function keyFromMediaUrl(url: string) {
  const prefix = "/api/media/";
  if (url.startsWith(prefix)) return url.slice(prefix.length);
  return null;
}
