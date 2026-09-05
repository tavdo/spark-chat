import { NextResponse } from "next/server";
import { getCurrentUser, type SafeUser } from "./auth";
import { canChat, isSuspended } from "./utils";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function error(message: string, status = 400) {
  return json({ error: message }, status);
}

export async function withUser() {
  const user = await getCurrentUser();
  if (!user) return { user: null, response: error("Sign in required", 401) };
  if (user.status === "BANNED") {
    return { user: null, response: error("Account banned", 403) };
  }
  return { user, response: null };
}

export async function withVerified() {
  const result = await withUser();
  if (!result.user) return result;
  if (!canChat(result.user)) {
    if (result.user.verificationStatus === "REJECTED") {
      return {
        user: null,
        response: error("Your verification was rejected", 403),
      };
    }
    if (isSuspended(result.user)) {
      return { user: null, response: error("Account is suspended", 403) };
    }
    return { user: null, response: error("Chat access denied", 403) };
  }
  return result;
}

export async function withAdmin() {
  const result = await withUser();
  if (!result.user) return result;
  if (result.user.role !== "ADMIN") {
    return { user: null, response: error("Admin only", 403) };
  }
  return result as { user: SafeUser; response: null };
}

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
