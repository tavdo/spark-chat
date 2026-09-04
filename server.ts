import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";
import { setupSocket } from "./src/server/socket";
import { startCleanupJob } from "./src/server/cleanup";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
const port = Number(process.env.PORT || 3000);

async function main() {
  const app = next({ dev, hostname, port });
  await app.prepare();
  const handle = app.getRequestHandler();

  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith("/socket.io")) return;
    handle(req, res);
  });

  const io = new Server(httpServer, {
    path: "/socket.io",
    cors: { origin: false },
  });

  setupSocket(io);
  startCleanupJob();

  httpServer.listen(port, () => {
    console.log(`Spark ready on http://${hostname}:${port}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
