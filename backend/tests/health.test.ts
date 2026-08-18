import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app.js";

const config = {
  NODE_ENV: "test" as const,
  PORT: 3000,
  DATABASE_URL: "postgresql://unused",
  JWT_SECRET: "test-secret-with-more-than-32-characters",
  CORS_ORIGIN: "http://localhost:5173",
  LOG_LEVEL: "fatal" as const
};

describe("GET /health", () => {
  it("expose l'état de l'API", async () => {
    const response = await request(createApp(config)).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "ayouta-api" });
  });
});
