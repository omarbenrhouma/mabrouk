import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const createStore = z.object({
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().min(3).max(250),
  city: z.string().trim().min(2).max(80),
  openingTime: z.string().regex(/^\d{2}:\d{2}$/),
  closingTime: z.string().regex(/^\d{2}:\d{2}$/),
  targetStaff: z.number().int().positive().max(500)
});
const updateStore = createStore.partial().extend({ isActive: z.boolean().optional() });

export function storesRouter(secret: string) {
  const router = Router();
  router.use(requireAuth(secret));

  router.get("/", async (_request, response) => {
    const stores = await prisma.store.findMany({
      where: { isActive: true },
      include: { manager: { select: { id: true, name: true } }, _count: { select: { employees: true } } },
      orderBy: [{ city: "asc" }, { name: "asc" }]
    });
    response.json({ data: stores });
  });

  router.post("/", requireAuth(secret, [Role.ADMIN]), async (request, response) => {
    const input = createStore.parse(request.body);
    const store = await prisma.store.create({ data: input });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "Store", entityId: store.id, action: "CREATE", newValue: input }
    });
    response.status(201).json({ data: store });
  });

  router.patch("/:id", requireAuth(secret, [Role.ADMIN]), async (request, response) => {
    const id = String(request.params.id);
    const input = updateStore.parse(request.body);
    const current = await prisma.store.findUnique({ where: { id } });
    if (!current) return response.status(404).json({ error: "Boutique introuvable" });
    const store = await prisma.store.update({ where: { id }, data: input });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "Store", entityId: id, action: "UPDATE", oldValue: current, newValue: input }
    });
    return response.json({ data: store });
  });

  router.delete("/:id", requireAuth(secret, [Role.ADMIN]), async (request, response) => {
    const id = String(request.params.id);
    const current = await prisma.store.findUnique({ where: { id } });
    if (!current) return response.status(404).json({ error: "Boutique introuvable" });
    const store = await prisma.store.update({ where: { id }, data: { isActive: false } });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "Store", entityId: id, action: "DEACTIVATE", oldValue: { isActive: current.isActive }, newValue: { isActive: false } }
    });
    return response.json({ data: store });
  });

  return router;
}
