import type { MessageType, ReportReason } from "@prisma/client";
import { prisma } from "./prisma";
import { REPORT_CONTEXT_LIMIT } from "./constants";
import { canChat, strangerPreview } from "./utils";

const STALE_MS = 20_000;

function partnerId(chat: { userAId: string; userBId: string }, userId: string) {
  return chat.userAId === userId ? chat.userBId : chat.userAId;
}

function isUserA(chat: { userAId: string }, userId: string) {
  return chat.userAId === userId;
}

async function areBlocked(a: string, b: string) {
  const row = await prisma.block.findFirst({
    where: {
      OR: [
        { userId: a, blockedUserId: b },
        { userId: b, blockedUserId: a },
      ],
    },
  });
  return Boolean(row);
}

export async function findActiveChat(userId: string) {
  return prisma.chat.findFirst({
    where: {
      status: "ACTIVE",
      OR: [{ userAId: userId }, { userBId: userId }],
    },
  });
}

export async function endChat(chatId: string) {
  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat || chat.status !== "ACTIVE") return;
  await prisma.chat.update({
    where: { id: chatId },
    data: {
      status: "ENDED",
      endedAt: new Date(),
      typingA: false,
      typingB: false,
    },
  });
}

export async function cleanupStale() {
  const cutoff = new Date(Date.now() - STALE_MS);
  await prisma.matchQueue.deleteMany({ where: { updatedAt: { lt: cutoff } } });

  const active = await prisma.chat.findMany({
    where: { status: "ACTIVE" },
    select: {
      id: true,
      lastSeenA: true,
      lastSeenB: true,
    },
    take: 80,
  });
  await Promise.all(
    active
      .filter((chat) => chat.lastSeenA < cutoff || chat.lastSeenB < cutoff)
      .map((chat) => endChat(chat.id))
  );
}

async function tryMatch(userId: string) {
  const others = await prisma.matchQueue.findMany({
    where: { userId: { not: userId } },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  for (const other of others) {
    if (await areBlocked(userId, other.userId)) continue;

    const [userA, userB] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.user.findUnique({ where: { id: other.userId } }),
    ]);
    if (!userA || !userB || !canChat(userA) || !canChat(userB)) continue;

    try {
      await prisma.matchQueue.delete({ where: { userId: other.userId } });
    } catch {
      continue;
    }
    await prisma.matchQueue.delete({ where: { userId } }).catch(() => null);

    return prisma.chat.create({
      data: { userAId: userA.id, userBId: userB.id },
    });
  }
  return null;
}

export async function joinQueue(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !canChat(user)) {
    return {
      error:
        user?.verificationStatus !== "APPROVED"
          ? "Your account is under review"
          : "You cannot join chat right now",
    };
  }

  const existing = await findActiveChat(userId);
  if (existing) return { chat: existing };

  await prisma.matchQueue.upsert({
    where: { userId },
    create: { userId },
    update: { updatedAt: new Date() },
  });

  return { chat: await tryMatch(userId) };
}

export async function leaveQueue(userId: string) {
  await prisma.matchQueue.delete({ where: { userId } }).catch(() => null);
}

async function chatPayload(chat: NonNullable<Awaited<ReturnType<typeof findActiveChat>>>, userId: string) {
  const partner = await prisma.user.findUnique({
    where: { id: partnerId(chat, userId) },
  });
  return {
    phase: "chatting" as const,
    chatId: chat.id,
    stranger: partner ? strangerPreview(partner) : null,
    typing: isUserA(chat, userId) ? chat.typingB : chat.typingA,
  };
}

export async function heartbeat(userId: string) {
  await cleanupStale();

  const chatting = await findActiveChat(userId);
  if (chatting) {
    const field = isUserA(chatting, userId) ? "lastSeenA" : "lastSeenB";
    const chat = await prisma.chat.update({
      where: { id: chatting.id },
      data: { [field]: new Date() },
    });
    const cutoff = new Date(Date.now() - STALE_MS);
    const partnerSeen = isUserA(chat, userId) ? chat.lastSeenB : chat.lastSeenA;
    if (partnerSeen < cutoff) {
      await endChat(chat.id);
      return { phase: "ended" as const, chatId: null, stranger: null, typing: false };
    }
    return chatPayload(chat, userId);
  }

  const queued = await prisma.matchQueue.findUnique({ where: { userId } });
  if (queued) {
    await prisma.matchQueue.update({
      where: { userId },
      data: { updatedAt: new Date() },
    });
    const chat = await tryMatch(userId);
    if (chat) return chatPayload(chat, userId);
    return { phase: "searching" as const, chatId: null, stranger: null, typing: false };
  }

  return { phase: "idle" as const, chatId: null, stranger: null, typing: false };
}

export async function skipChat(userId: string) {
  const chat = await findActiveChat(userId);
  if (chat) await endChat(chat.id);
  return joinQueue(userId);
}

export async function blockChat(userId: string) {
  const chat = await findActiveChat(userId);
  if (!chat) return;
  const other = partnerId(chat, userId);
  await prisma.block.upsert({
    where: { userId_blockedUserId: { userId, blockedUserId: other } },
    update: {},
    create: { userId, blockedUserId: other },
  });
  await endChat(chat.id);
}

export async function reportChat(userId: string, reason: ReportReason, details?: string) {
  const chat = await findActiveChat(userId);
  if (!chat) return;
  const other = partnerId(chat, userId);
  const messages = await prisma.message.findMany({
    where: { chatId: chat.id },
    orderBy: { createdAt: "desc" },
    take: REPORT_CONTEXT_LIMIT,
    select: { senderId: true, type: true, content: true, createdAt: true },
  });
  await prisma.report.create({
    data: {
      reporterId: userId,
      reportedId: other,
      chatId: chat.id,
      reason,
      details: details?.slice(0, 500),
      chatContext: messages.reverse(),
    },
  });
}

export async function setTyping(userId: string, typing: boolean) {
  const chat = await findActiveChat(userId);
  if (!chat) return;
  const field = isUserA(chat, userId) ? "typingA" : "typingB";
  await prisma.chat.update({
    where: { id: chat.id },
    data: { [field]: typing },
  });
}

export async function listMessages(chatId: string, since?: string) {
  return prisma.message.findMany({
    where: {
      chatId,
      ...(since ? { createdAt: { gt: new Date(since) } } : {}),
    },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
}

export async function sendMessage(
  userId: string,
  payload: { type?: MessageType; content?: string; waveform?: number[] }
): Promise<{ error: string } | { message: Awaited<ReturnType<typeof prisma.message.create>> }> {
  const chat = await findActiveChat(userId);
  if (!chat) return { error: "No active chat" as const };

  const type = payload.type || "TEXT";
  const content = (payload.content || "").trim();
  if (!content) return { error: "Message is empty" as const };
  if (type === "TEXT" && content.length > 2000) {
    return { error: "Message is too long" as const };
  }

  const message = await prisma.message.create({
    data: {
      chatId: chat.id,
      senderId: userId,
      type,
      content,
      waveform: payload.waveform || [],
    },
  });

  return { message };
}

export function serializeMessage(message: {
  id: string;
  senderId: string;
  type: MessageType;
  content: string;
  waveform: number[];
  createdAt: Date;
}) {
  return {
    id: message.id,
    senderId: message.senderId,
    type: message.type,
    content: message.content,
    waveform: Array.isArray(message.waveform) ? message.waveform : [],
    createdAt: message.createdAt.toISOString(),
  };
}
