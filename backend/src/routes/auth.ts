import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";

const credentials = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128)
});

export function authRouter(secret: string) {
  const router = Router();

  router.post("/login", async (request, response) => {
    const input = credentials.parse(request.body);
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.isActive || !(await bcrypt.compare(input.password, user.passwordHash))) {
      return response.status(401).json({ error: "Identifiants invalides" });
    }

    const accessToken = jwt.sign({ role: user.role }, secret, {
      subject: user.id,
      expiresIn: "15m",
      issuer: "ayouta-api",
      audience: "ayouta-web"
    });
    return response.json({
      accessToken,
      expiresIn: 900,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  });

  return router;
}
