import { prisma } from "../lib/prisma";
import { deleteObject, keyFromMediaUrl } from "../lib/storage";
import { MESSAGE_RETENTION_HOURS } from "../lib/constants";

const HOUR = 60 * 60 * 1000;

export function startCleanupJob() {
  const run = async () => {
    const cutoff = new Date(Date.now() - MESSAGE_RETENTION_HOURS * HOUR);
    try {
      const stale = await prisma.message.findMany({
        where: {
          createdAt: { lt: cutoff },
          type: { in: ["PHOTO", "VOICE"] },
        },
        select: { id: true, content: true },
      });

      for (const msg of stale) {
        const key = keyFromMediaUrl(msg.content);
        if (key) await deleteObject(key);
      }

      await prisma.message.deleteMany({
        where: { createdAt: { lt: cutoff } },
      });

      await prisma.chat.deleteMany({
        where: {
          status: "ENDED",
          endedAt: { lt: cutoff },
          reports: { none: { status: "OPEN" } },
        },
      });
    } catch (err) {
      console.error("cleanup job failed", err);
    }
  };

  void run();
  return setInterval(run, HOUR);
}
