import { z } from "zod";

export const registerSchema = z.object({
  nickname: z.string().trim().min(2).max(24),
  email: z.string().trim().email().max(120),
  password: z.string().min(8).max(72),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  age: z.coerce.number().int().min(18).max(99),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const profileSchema = z.object({
  nickname: z.string().trim().min(2).max(24).optional(),
  bio: z.string().trim().max(280).optional().nullable(),
  interests: z.array(z.string().trim().max(32)).max(12).optional(),
});

export const rejectSchema = z.object({
  reason: z.string().trim().min(4).max(280),
});

export const reportSchema = z.object({
  reason: z.enum([
    "SPAM",
    "INAPPROPRIATE",
    "FAKE_PROFILE",
    "HARASSMENT",
    "OTHER",
  ]),
  details: z.string().trim().max(500).optional(),
});

export const moderationSchema = z.object({
  action: z.enum(["WARN", "SUSPEND", "BAN", "DISMISS"]),
  note: z.string().trim().max(280).optional(),
});
