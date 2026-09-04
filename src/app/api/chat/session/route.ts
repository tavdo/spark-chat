import { NextRequest } from "next/server";
import { error, json, withVerified } from "@/lib/api";
import {
  blockChat,
  heartbeat,
  joinQueue,
  leaveQueue,
  listMessages,
  reportChat,
  serializeMessage,
  setTyping,
  skipChat,
} from "@/lib/matchmaking";
import { reportSchema } from "@/lib/validators";
import type { ReportReason } from "@prisma/client";

async function sessionPayload(userId: string, since?: string | null) {
  const state = await heartbeat(userId);
  if (state.phase === "chatting" && state.chatId) {
    const messages = await listMessages(state.chatId, since || undefined);
    return {
      ...state,
      messages: messages.map(serializeMessage),
    };
  }
  return { ...state, messages: [] };
}

export async function GET(req: NextRequest) {
  const { user, response } = await withVerified();
  if (!user) return response;
  const since = req.nextUrl.searchParams.get("since");
  return json(await sessionPayload(user.id, since));
}

export async function POST(req: NextRequest) {
  const { user, response } = await withVerified();
  if (!user) return response;

  const body = await req.json().catch(() => ({}));
  const action = String(body.action || "");

  if (action === "join") {
    const result = await joinQueue(user.id);
    if (result.error) return error(result.error, 403);
    return json(await sessionPayload(user.id));
  }

  if (action === "leave") {
    await leaveQueue(user.id);
    return json({ phase: "idle", chatId: null, stranger: null, typing: false, messages: [] });
  }

  if (action === "skip") {
    if (body.searching) {
      await leaveQueue(user.id);
      return json({ phase: "idle", chatId: null, stranger: null, typing: false, messages: [] });
    }
    const result = await skipChat(user.id);
    if (result.error) return error(result.error, 403);
    return json(await sessionPayload(user.id));
  }

  if (action === "block") {
    await blockChat(user.id);
    return json({ phase: "idle", chatId: null, stranger: null, typing: false, messages: [] });
  }

  if (action === "report") {
    const parsed = reportSchema.safeParse(body);
    if (!parsed.success) return error("Invalid report");
    await reportChat(user.id, parsed.data.reason as ReportReason, parsed.data.details);
    return json({ ok: true });
  }

  if (action === "typing") {
    await setTyping(user.id, Boolean(body.typing));
    return json({ ok: true });
  }

  return error("Unknown action");
}
