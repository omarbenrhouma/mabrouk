import cors from "cors";
import express from "express";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import type { AppConfig } from "./config.js";
import { errorHandler, notFound } from "./middleware/errors.js";
import { authRouter } from "./routes/auth.js";
import { shiftsRouter } from "./routes/shifts.js";
import { storesRouter } from "./routes/stores.js";
import { operationsRouter } from "./routes/operations.js";

export function createApp(config: AppConfig) {
  const app = express();
  const allowedOrigins = config.CORS_ORIGIN.split(",").map((origin) => origin.trim());
  app.disable("x-powered-by");
  app.use(pinoHttp({ level: config.LOG_LEVEL }));
  app.use(helmet());
  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`Origine CORS refusée : ${origin}`));
    },
    credentials: true
  }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/health", (_request, response) => {
    response.json({ status: "ok", service: "ayouta-api" });
  });
  app.use("/api/v1/auth", authRouter(config.JWT_SECRET));
  app.use("/api/v1/stores", storesRouter(config.JWT_SECRET));
  app.use("/api/v1/shifts", shiftsRouter(config.JWT_SECRET));
  app.use("/api/v1", operationsRouter(config.JWT_SECRET));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
