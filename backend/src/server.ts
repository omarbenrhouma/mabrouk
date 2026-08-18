import { createApp } from "./app.js";
import { loadConfig } from "./config.js";
import { prisma } from "./lib/prisma.js";

const config = loadConfig();
const server = createApp(config).listen(config.PORT, "0.0.0.0", () => {
  console.info(`Ayouta API démarrée sur le port ${config.PORT}`);
});

async function shutdown(signal: string) {
  console.info(`${signal} reçu, arrêt propre...`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
