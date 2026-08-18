import { Role } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const shiftFields = z.object({
  employeeId: z.string().min(1),
  storeId: z.string().min(1),
  startsAt: z.coerce.date(),
  endsAt: z.coerce.date(),
  breakMins: z.number().int().min(0).max(240).default(0),
  position: z.string().trim().min(2).max(80).default("Vente")
});
const shiftInput = shiftFields.refine((data) => data.endsAt > data.startsAt, { message: "La fin doit suivre le début", path: ["endsAt"] });

export function shiftsRouter(secret: string) {
  const router = Router();
  router.use(requireAuth(secret));

  router.get("/", async (request, response) => {
    const query = z.object({
      from: z.coerce.date(),
      to: z.coerce.date(),
      employeeId: z.string().optional()
    }).parse(request.query);
    const employeeId = request.auth!.role === Role.EMPLOYEE
      ? (await prisma.employeeProfile.findUnique({ where: { userId: request.auth!.userId } }))?.id
      : query.employeeId;
    const shifts = await prisma.scheduleShift.findMany({
      where: { employeeId, startsAt: { gte: query.from }, endsAt: { lte: query.to } },
      include: { store: { select: { id: true, code: true, name: true } }, employee: { include: { user: { select: { name: true } } } } },
      orderBy: { startsAt: "asc" }
    });
    response.json({ data: shifts });
  });

  router.post("/", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const input = shiftInput.parse(request.body);
    const conflict = await prisma.scheduleShift.findFirst({
      where: {
        employeeId: input.employeeId,
        status: { not: "CANCELLED" },
        startsAt: { lt: input.endsAt },
        endsAt: { gt: input.startsAt }
      }
    });
    if (conflict) return response.status(409).json({ error: "Ce vendeur possède déjà un shift sur ce créneau", conflictId: conflict.id });

    const shift = await prisma.scheduleShift.create({
      data: { ...input, createdBy: request.auth!.userId, updatedBy: request.auth!.userId }
    });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "ScheduleShift", entityId: shift.id, action: "CREATE", newValue: input }
    });
    return response.status(201).json({ data: shift });
  });

  router.patch("/:id", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const id = String(request.params.id);
    const input = shiftFields.partial().parse(request.body);
    const current = await prisma.scheduleShift.findUnique({ where: { id } });
    if (!current) return response.status(404).json({ error: "Shift introuvable" });
    const startsAt = input.startsAt ?? current.startsAt;
    const endsAt = input.endsAt ?? current.endsAt;
    const employeeId = input.employeeId ?? current.employeeId;
    if (endsAt <= startsAt) return response.status(400).json({ error: "La fin doit suivre le début" });
    const conflict = await prisma.scheduleShift.findFirst({
      where: { id: { not: id }, employeeId, status: { not: "CANCELLED" }, startsAt: { lt: endsAt }, endsAt: { gt: startsAt } }
    });
    if (conflict) return response.status(409).json({ error: "Ce vendeur possède déjà un shift sur ce créneau", conflictId: conflict.id });
    const shift = await prisma.scheduleShift.update({
      where: { id },
      data: { ...input, updatedBy: request.auth!.userId }
    });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "ScheduleShift", entityId: id, action: "UPDATE", newValue: input }
    });
    if (current.status === "PUBLISHED") {
      const employee = await prisma.employeeProfile.findUnique({ where: { id: shift.employeeId } });
      if (employee) await prisma.notification.create({
        data: { userId: employee.userId, type: "SHIFT_UPDATED", title: "Planning modifié", message: "Un shift publié vient d’être modifié.", entityId: shift.id }
      });
    }
    return response.json({ data: shift });
  });

  router.post("/:id/publish", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const id = String(request.params.id);
    const current = await prisma.scheduleShift.findUnique({ where: { id }, include: { employee: true, store: true } });
    if (!current) return response.status(404).json({ error: "Shift introuvable" });
    const shift = await prisma.scheduleShift.update({ where: { id }, data: { status: "PUBLISHED", updatedBy: request.auth!.userId } });
    await prisma.notification.create({
      data: {
        userId: current.employee.userId,
        type: "SHIFT_PUBLISHED",
        title: "Nouveau shift publié",
        message: `${current.store.name}, le ${current.startsAt.toLocaleDateString("fr-TN")}`,
        entityId: current.id
      }
    });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "ScheduleShift", entityId: id, action: "PUBLISH", newValue: { status: "PUBLISHED" } }
    });
    return response.json({ data: shift });
  });

  router.delete("/:id", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const id = String(request.params.id);
    const current = await prisma.scheduleShift.findUnique({ where: { id } });
    if (!current) return response.status(404).json({ error: "Shift introuvable" });
    const shift = await prisma.scheduleShift.update({ where: { id }, data: { status: "CANCELLED", updatedBy: request.auth!.userId } });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "ScheduleShift", entityId: id, action: "CANCEL", newValue: { status: "CANCELLED" } }
    });
    return response.json({ data: shift });
  });

  return router;
}
