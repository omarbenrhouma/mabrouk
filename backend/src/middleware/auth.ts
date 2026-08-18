import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { Role } from "@prisma/client";

type Claims = { sub: string; role: Role };

export function requireAuth(secret: string, roles?: Role[]) {
  return (request: Request, response: Response, next: NextFunction) => {
    const token = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    if (!token) return response.status(401).json({ error: "Authentification requise" });

    try {
      const claims = jwt.verify(token, secret) as Claims;
      request.auth = { userId: claims.sub, role: claims.role };
      if (roles && !roles.includes(claims.role)) {
        return response.status(403).json({ error: "Accès refusé" });
      }
      next();
    } catch {
      return response.status(401).json({ error: "Jeton invalide ou expiré" });
    }
  };
}
