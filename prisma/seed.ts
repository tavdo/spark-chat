import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function portraitSvg(initial: string, hue: number) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="#0b0b12"/>
  <circle cx="320" cy="248" r="118" fill="hsl(${hue} 72% 58%)"/>
  <ellipse cx="320" cy="560" rx="210" ry="210" fill="hsl(${hue} 62% 42%)"/>
  <text x="320" y="270" text-anchor="middle" fill="white" font-size="84" font-family="ui-sans-serif, system-ui, sans-serif" font-weight="700">${initial}</text>
</svg>`;
}

async function savePortrait(initial: string, hue: number) {
  const key = `verification/${randomUUID()}.svg`;
  const full = path.join(process.cwd(), "uploads", key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, portraitSvg(initial, hue), "utf8");
  return `/api/media/${key}`;
}

async function upsertUser(data: {
  email: string;
  nickname: string;
  password: string;
  gender: "MALE" | "FEMALE" | "OTHER";
  age: number;
  role: "USER" | "ADMIN";
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED";
  verificationRejectReason?: string | null;
  bio?: string;
  photoUrl?: string | null;
}) {
  const passwordHash = await bcrypt.hash(data.password, 12);
  return prisma.user.upsert({
    where: { email: data.email },
    update: {
      role: data.role,
      verificationStatus: data.verificationStatus,
      verificationRejectReason: data.verificationRejectReason ?? null,
      verificationPhotoUrl: data.photoUrl ?? undefined,
      status: "ACTIVE",
    },
    create: {
      email: data.email,
      nickname: data.nickname,
      passwordHash,
      gender: data.gender,
      age: data.age,
      role: data.role,
      verificationStatus: data.verificationStatus,
      verificationRejectReason: data.verificationRejectReason ?? null,
      verificationPhotoUrl: data.photoUrl ?? null,
      status: "ACTIVE",
      bio: data.bio,
    },
  });
}

async function main() {
  await upsertUser({
    email: process.env.ADMIN_EMAIL || "admin@spark.local",
    nickname: "Admin",
    password: process.env.ADMIN_PASSWORD || "changeme-admin",
    gender: "OTHER",
    age: 30,
    role: "ADMIN",
    verificationStatus: "APPROVED",
    bio: "Moderation account",
  });

  const alex = await upsertUser({
    email: "alex@spark.local",
    nickname: "Alex",
    password: "demo12345",
    gender: "MALE",
    age: 24,
    role: "USER",
    verificationStatus: "APPROVED",
    bio: "Demo account A",
  });

  await upsertUser({
    email: "jordan@spark.local",
    nickname: "Jordan",
    password: "demo12345",
    gender: "FEMALE",
    age: 23,
    role: "USER",
    verificationStatus: "APPROVED",
    bio: "Demo account B",
  });

  await upsertUser({
    email: "casey@spark.local",
    nickname: "Casey",
    password: "demo12345",
    gender: "FEMALE",
    age: 21,
    role: "USER",
    verificationStatus: "PENDING",
    bio: "Waiting on photo review",
    photoUrl: await savePortrait("C", 280),
  });

  const riley = await upsertUser({
    email: "riley@spark.local",
    nickname: "Riley",
    password: "demo12345",
    gender: "MALE",
    age: 27,
    role: "USER",
    verificationStatus: "APPROVED",
    bio: "Reported in the demo queue",
    photoUrl: await savePortrait("R", 190),
  });

  await upsertUser({
    email: "morgan@spark.local",
    nickname: "Morgan",
    password: "demo12345",
    gender: "MALE",
    age: 26,
    role: "USER",
    verificationStatus: "REJECTED",
    verificationRejectReason: "Photo does not clearly show a live face. Please recapture.",
    bio: "Rejected verification demo",
    photoUrl: await savePortrait("M", 24),
  });

  const existing = await prisma.report.findFirst({
    where: { reporterId: alex.id, reportedId: riley.id },
  });
  if (!existing) {
    await prisma.report.create({
      data: {
        reporterId: alex.id,
        reportedId: riley.id,
        reason: "HARASSMENT",
        details: "Sent repeated unwanted messages after I asked to skip.",
        chatContext: [
          {
            senderId: riley.id,
            type: "TEXT",
            content: "hey you there",
            createdAt: new Date().toISOString(),
          },
          {
            senderId: alex.id,
            type: "TEXT",
            content: "not interested, skipping",
            createdAt: new Date().toISOString(),
          },
          {
            senderId: riley.id,
            type: "TEXT",
            content: "don't skip. look at this",
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
  }

  console.log(
    "Seeded admin, chat demos (alex/jordan), pending Casey, rejected Morgan, report on Riley"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
