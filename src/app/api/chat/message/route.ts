import { error, json, withVerified } from "@/lib/api";
import { sendMessage, serializeMessage } from "@/lib/matchmaking";
import type { MessageType } from "@prisma/client";

export async function POST(req: Request) {
  const { user, response } = await withVerified();
  if (!user) return response;

  const body = await req.json().catch(() => null);
  if (!body) return error("Invalid message");

  const result = await sendMessage(user.id, {
    type: body.type as MessageType | undefined,
    content: body.content,
    waveform: Array.isArray(body.waveform) ? body.waveform : [],
  });
  if ("message" in result) {
    return json({ ok: true, message: serializeMessage(result.message) });
  }
  return error(result.error);
}
