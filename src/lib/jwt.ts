import { SignJWT, jwtVerify } from "jose";
import { COOKIE_NAME } from "./constants";

export type TokenPayload = {
  id: string;
  role: "USER" | "ADMIN";
};

function secret() {
  const value = process.env.JWT_SECRET;
  if (!value) {
    throw new Error("JWT_SECRET is not set");
  }
  return new TextEncoder().encode(value);
}

export async function signToken(payload: TokenPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (typeof payload.id !== "string") return null;
    if (payload.role !== "USER" && payload.role !== "ADMIN") return null;
    return { id: payload.id, role: payload.role };
  } catch {
    return null;
  }
}

export function parseCookieHeader(header: string | undefined, name = COOKIE_NAME) {
  if (!header) return null;
  const parts = header.split(";").map((p) => p.trim());
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx);
    if (key === name) return decodeURIComponent(part.slice(idx + 1));
  }
  return null;
}

export const cookieOptions = {
  name: COOKIE_NAME,
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 7,
};
