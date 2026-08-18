import type { ErrorRequestHandler, RequestHandler } from "express";
import { ZodError } from "zod";

export const notFound: RequestHandler = (_request, response) => {
  response.status(404).json({ error: "Ressource introuvable" });
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  void _next;
  request.log?.error({ err: error }, "request failed");
  if (error instanceof Error && error.message.startsWith("Origine CORS refusée")) {
    response.status(403).json({ error: "Origine réseau non autorisée" });
    return;
  }
  if (error instanceof ZodError) {
    response.status(400).json({ error: "Données invalides", details: error.flatten() });
    return;
  }
  response.status(500).json({ error: "Erreur interne" });
};
