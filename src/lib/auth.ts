import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { cookieOptions, signToken, verifyToken } from "./jwt";
import type { User } from "@prisma/client";

export type SafeUser = Omit<User, "passwordHash">;

function strip(user: User): SafeUser {
  const { passwordHash: _, ...rest } = user;
  return rest;
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function checkPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function setSession(user: { id: string; role: "USER" | "ADMIN" }) {
  const token = await signToken({ id: user.id, role: user.role });
  const jar = await cookies();
  jar.set({
    ...cookieOptions,
    value: token,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(cookieOptions.name);
}

export async function getSessionToken() {
  const jar = await cookies();
  return jar.get(cookieOptions.name)?.value ?? null;
}

export async function getCurrentUser(): Promise<SafeUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const payload = await verifyToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({ where: { id: payload.id } });
  if (!user) return null;
  return strip(user);
}

export async function requireUser(): Promise<SafeUser> {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Unauthorized");
    (err as Error & { status: number }).status = 401;
    throw err;
  }
  return user;
}
