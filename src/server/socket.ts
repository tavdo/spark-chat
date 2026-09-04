import type { Server, Socket } from "socket.io";
import { prisma } from "../lib/prisma";
import { parseCookieHeader, verifyToken } from "../lib/jwt";
import { canChat, strangerPreview } from "../lib/utils";
import { REPORT_CONTEXT_LIMIT } from "../lib/constants";
import type { MessageType, ReportReason } from "@prisma/client";

type QueueEntry = {
  userId: string;
  socketId: string;
};

const queue: QueueEntry[] = [];
const socketToUser = new Map<string, string>();
const userToSocket = new Map<string, string>();
const userToChat = new Map<string, string>();

async function loadUser(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

function leaveQueue(userId: string) {
  const idx = queue.findIndex((q) => q.userId === userId);
  if (idx >= 0) queue.splice(idx, 1);
}

function partnerId(chat: { userAId: string; userBId: string }, userId: string) {
  return chat.userAId === userId ? chat.userBId : chat.userAId;
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

async function snapshotMessages(chatId: string) {
  const messages = await prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: "desc" },
    take: REPORT_CONTEXT_LIMIT,
    select: {
      senderId: true,
      type: true,
      content: true,
      createdAt: true,
    },
  });
  return messages.reverse();
}

async function endChat(io: Server, chatId: string, reason: "skip" | "disconnect" | "block") {
  const chat = await prisma.chat.findUnique({ where: { id: chatId } });
  if (!chat || chat.status !== "ACTIVE") return;

  await prisma.chat.update({
    where: { id: chatId },
    data: { status: "ENDED", endedAt: new Date() },
  });

  userToChat.delete(chat.userAId);
  userToChat.delete(chat.userBId);

  const payload = {
    chatId,
    reason,
    message:
      reason === "block"
        ? "You blocked this stranger"
        : "Stranger disconnected",
  };

  io.to(`chat:${chatId}`).emit("chat:ended", payload);

  const sockA = userToSocket.get(chat.userAId);
  const sockB = userToSocket.get(chat.userBId);
  if (sockA) io.sockets.sockets.get(sockA)?.leave(`chat:${chatId}`);
  if (sockB) io.sockets.sockets.get(sockB)?.leave(`chat:${chatId}`);
}

async function tryMatch(io: Server) {
  if (queue.length < 2) return;

  for (let i = 0; i < queue.length; i++) {
    for (let j = i + 1; j < queue.length; j++) {
      const a = queue[i];
      const b = queue[j];
      if (a.userId === b.userId) continue;
      if (await areBlocked(a.userId, b.userId)) continue;

      queue.splice(j, 1);
      queue.splice(i, 1);

      const [userA, userB] = await Promise.all([
        loadUser(a.userId),
        loadUser(b.userId),
      ]);
      if (!userA || !userB || !canChat(userA) || !canChat(userB)) {
        if (userA && canChat(userA)) queue.unshift(a);
        if (userB && canChat(userB)) queue.unshift(b);
        return tryMatch(io);
      }

      const chat = await prisma.chat.create({
        data: { userAId: userA.id, userBId: userB.id },
      });

      userToChat.set(userA.id, chat.id);
      userToChat.set(userB.id, chat.id);

      const sockA = io.sockets.sockets.get(a.socketId);
      const sockB = io.sockets.sockets.get(b.socketId);
      sockA?.join(`chat:${chat.id}`);
      sockB?.join(`chat:${chat.id}`);

      sockA?.emit("chat:matched", {
        chatId: chat.id,
        stranger: strangerPreview(userB),
      });
      sockB?.emit("chat:matched", {
        chatId: chat.id,
        stranger: strangerPreview(userA),
      });
      return;
    }
  }
}

async function joinQueue(io: Server, socket: Socket, userId: string) {
  if (userToChat.has(userId)) {
    socket.emit("error", { message: "Already in a chat" });
    return;
  }
  if (queue.some((q) => q.userId === userId)) {
    socket.emit("queue:waiting");
    return;
  }

  const user = await loadUser(userId);
  if (!user || !canChat(user)) {
    socket.emit("error", {
      message:
        user?.verificationStatus !== "APPROVED"
          ? "Your account is under review"
          : "You cannot join chat right now",
    });
    return;
  }

  queue.push({ userId, socketId: socket.id });
  socket.emit("queue:waiting");
  await tryMatch(io);
}

export function setupSocket(io: Server) {
  io.use(async (socket, next) => {
    try {
      const token =
        parseCookieHeader(socket.handshake.headers.cookie) ||
        (typeof socket.handshake.auth?.token === "string"
          ? socket.handshake.auth.token
          : null);
      if (!token) return next(new Error("Unauthorized"));
      const payload = await verifyToken(token);
      if (!payload) return next(new Error("Unauthorized"));
      const user = await loadUser(payload.id);
      if (!user || user.status === "BANNED") return next(new Error("Unauthorized"));
      socket.data.userId = user.id;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as string;
    const previous = userToSocket.get(userId);
    if (previous && previous !== socket.id) {
      io.sockets.sockets.get(previous)?.disconnect(true);
    }
    socketToUser.set(socket.id, userId);
    userToSocket.set(userId, socket.id);

    socket.on("queue:join", () => joinQueue(io, socket, userId));

    socket.on("queue:leave", () => {
      leaveQueue(userId);
      socket.emit("queue:left");
    });

    socket.on(
      "chat:message",
      async (payload: {
        chatId?: string;
        type?: MessageType;
        content?: string;
        waveform?: number[];
      }) => {
        const chatId = payload.chatId || userToChat.get(userId);
        if (!chatId) return;
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat || chat.status !== "ACTIVE") return;
        if (chat.userAId !== userId && chat.userBId !== userId) return;

        const type = payload.type || "TEXT";
        const content = (payload.content || "").trim();
        if (!content) return;
        if (type === "TEXT" && content.length > 2000) return;

        const message = await prisma.message.create({
          data: {
            chatId,
            senderId: userId,
            type,
            content,
            waveform: payload.waveform || [],
          },
        });

        io.to(`chat:${chatId}`).emit("chat:message", {
          id: message.id,
          chatId,
          senderId: message.senderId,
          type: message.type,
          content: message.content,
            waveform: Array.isArray(message.waveform)
              ? (message.waveform as number[])
              : [],
          createdAt: message.createdAt.toISOString(),
        });
      }
    );

    socket.on("chat:typing", (payload: { chatId?: string; typing?: boolean }) => {
      const chatId = payload.chatId || userToChat.get(userId);
      if (!chatId) return;
      socket.to(`chat:${chatId}`).emit("chat:typing", {
        typing: Boolean(payload.typing),
      });
    });

    socket.on("chat:skip", async () => {
      const chatId = userToChat.get(userId);
      leaveQueue(userId);
      if (chatId) await endChat(io, chatId, "skip");
      await joinQueue(io, socket, userId);
    });

    socket.on("chat:block", async () => {
      const chatId = userToChat.get(userId);
      if (!chatId) return;
      const chat = await prisma.chat.findUnique({ where: { id: chatId } });
      if (!chat) return;
      const other = partnerId(chat, userId);
      await prisma.block.upsert({
        where: { userId_blockedUserId: { userId, blockedUserId: other } },
        update: {},
        create: { userId, blockedUserId: other },
      });
      await endChat(io, chatId, "block");
      socket.emit("chat:blocked");
    });

    socket.on(
      "chat:report",
      async (payload: { reason?: ReportReason; details?: string }) => {
        const chatId = userToChat.get(userId);
        if (!chatId || !payload.reason) return;
        const chat = await prisma.chat.findUnique({ where: { id: chatId } });
        if (!chat) return;
        const other = partnerId(chat, userId);
        const chatContext = await snapshotMessages(chatId);
        await prisma.report.create({
          data: {
            reporterId: userId,
            reportedId: other,
            chatId,
            reason: payload.reason,
            details: payload.details?.slice(0, 500),
            chatContext,
          },
        });
        socket.emit("chat:reported");
      }
    );

    socket.on("disconnect", async () => {
      leaveQueue(userId);
      socketToUser.delete(socket.id);
      if (userToSocket.get(userId) === socket.id) {
        userToSocket.delete(userId);
      }
      const chatId = userToChat.get(userId);
      if (chatId) await endChat(io, chatId, "disconnect");
    });
  });
}
