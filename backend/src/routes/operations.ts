import { AttendanceStatus, ContractType, RequestStatus, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const requestInput = z.object({
  requestType: z.enum(["ABSENCE", "SHIFT_CHANGE", "REPLACEMENT"]),
  shiftId: z.string().optional(),
  requestedDate: z.coerce.date(),
  requestedStart: z.coerce.date().optional(),
  requestedEnd: z.coerce.date().optional(),
  reason: z.string().trim().min(5).max(500)
});
const employeeInput = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
  phone: z.string().trim().max(30).optional(),
  contractType: z.nativeEnum(ContractType),
  weeklyHours: z.number().int().min(1).max(60),
  jobTitle: z.string().trim().min(2).max(80).default("Vendeur"),
  hireDate: z.coerce.date(),
  primaryStoreId: z.string().min(1)
});
const assignmentInput = z.object({
  storeId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  reason: z.string().trim().min(3).max(300)
}).refine((value) => !value.endDate || value.endDate >= value.startDate, { path: ["endDate"], message: "La fin doit suivre le début" });

async function employeeForUser(userId: string) {
  return prisma.employeeProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, email: true, role: true } },
      primaryStore: { select: { id: true, code: true, name: true, city: true } }
    }
  });
}

export function operationsRouter(secret: string) {
  const router = Router();
  router.use(requireAuth(secret));

  router.get("/me", async (request, response) => {
    const user = await prisma.user.findUnique({
      where: { id: request.auth!.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true }
    });
    if (!user) return response.status(404).json({ error: "Utilisateur introuvable" });
    const employee = user.role === Role.EMPLOYEE ? await employeeForUser(user.id) : null;
    return response.json({ data: { ...user, employee } });
  });

  router.get("/dashboard", async (request, response) => {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const weekEnd = new Date(startOfDay);
    weekEnd.setDate(weekEnd.getDate() + 7);

    if (request.auth!.role === Role.EMPLOYEE) {
      const employee = await employeeForUser(request.auth!.userId);
      if (!employee) return response.status(404).json({ error: "Profil employé introuvable" });
      const [nextShifts, recentAttendances, pendingRequests] = await Promise.all([
        prisma.scheduleShift.findMany({
          where: { employeeId: employee.id, startsAt: { gte: startOfDay }, status: { not: "CANCELLED" } },
          include: {
            store: { select: { id: true, code: true, name: true, city: true } },
            attendance: true
          },
          orderBy: { startsAt: "asc" },
          take: 8
        }),
        prisma.attendance.findMany({
          where: { employeeId: employee.id },
          include: { store: { select: { name: true } }, shift: true },
          orderBy: { createdAt: "desc" },
          take: 6
        }),
        prisma.changeRequest.count({ where: { employeeId: employee.id, status: RequestStatus.PENDING } })
      ]);
      return response.json({ data: { employee, nextShifts, recentAttendances, pendingRequests } });
    }

    const [activeStores, activeEmployees, todayShifts, pendingRequests, anomalies, upcomingShifts] = await Promise.all([
      prisma.store.count({ where: { isActive: true } }),
      prisma.employeeProfile.count({ where: { isActive: true } }),
      prisma.scheduleShift.count({ where: { startsAt: { gte: startOfDay, lte: endOfDay }, status: { not: "CANCELLED" } } }),
      prisma.changeRequest.count({ where: { status: RequestStatus.PENDING } }),
      prisma.attendance.count({ where: { createdAt: { gte: startOfDay }, status: { in: ["LATE", "ABSENT", "LEFT_EARLY"] } } }),
      prisma.scheduleShift.findMany({
        where: { startsAt: { gte: startOfDay, lte: weekEnd }, status: { not: "CANCELLED" } },
        include: {
          store: { select: { id: true, code: true, name: true } },
          employee: { include: { user: { select: { name: true } } } },
          attendance: true
        },
        orderBy: { startsAt: "asc" },
        take: 30
      })
    ]);
    return response.json({
      data: { metrics: { activeStores, activeEmployees, todayShifts, pendingRequests, anomalies }, upcomingShifts }
    });
  });

  router.get("/employees", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (_request, response) => {
    const employees = await prisma.employeeProfile.findMany({
      include: {
        user: { select: { id: true, name: true, email: true, role: true, isActive: true } },
        primaryStore: { select: { id: true, code: true, name: true } },
        shifts: { where: { startsAt: { gte: new Date() } }, orderBy: { startsAt: "asc" }, take: 1 }
      },
      orderBy: { user: { name: "asc" } }
    });
    response.json({ data: employees });
  });

  router.post("/employees", requireAuth(secret, [Role.ADMIN]), async (request, response) => {
    const input = employeeInput.parse(request.body);
    const passwordHash = await bcrypt.hash(input.password, 12);
    try {
      const employee = await prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: { name: input.name, email: input.email, passwordHash, role: Role.EMPLOYEE }
        });
        return transaction.employeeProfile.create({
          data: {
            userId: user.id,
            phone: input.phone,
            contractType: input.contractType,
            weeklyHours: input.weeklyHours,
            jobTitle: input.jobTitle,
            hireDate: input.hireDate,
            primaryStoreId: input.primaryStoreId
          },
          include: { user: { select: { name: true, email: true, isActive: true } }, primaryStore: true }
        });
      });
      await prisma.auditLog.create({
        data: { actorId: request.auth!.userId, entityType: "EmployeeProfile", entityId: employee.id, action: "CREATE", newValue: { name: input.name, email: input.email, contractType: input.contractType, primaryStoreId: input.primaryStoreId } }
      });
      return response.status(201).json({ data: employee });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
        return response.status(409).json({ error: "Cette adresse email est déjà utilisée" });
      }
      throw error;
    }
  });

  router.patch("/employees/:id", requireAuth(secret, [Role.ADMIN]), async (request, response) => {
    const id = String(request.params.id);
    const input = employeeInput.omit({ password: true }).partial().extend({ isActive: z.boolean().optional() }).parse(request.body);
    const current = await prisma.employeeProfile.findUnique({ where: { id }, include: { user: true } });
    if (!current) return response.status(404).json({ error: "Employé introuvable" });
    const employee = await prisma.$transaction(async (transaction) => {
      if (input.name || input.email || input.isActive !== undefined) {
        await transaction.user.update({
          where: { id: current.userId },
          data: { name: input.name, email: input.email, isActive: input.isActive }
        });
      }
      return transaction.employeeProfile.update({
        where: { id },
        data: {
          phone: input.phone,
          contractType: input.contractType,
          weeklyHours: input.weeklyHours,
          jobTitle: input.jobTitle,
          hireDate: input.hireDate,
          primaryStoreId: input.primaryStoreId,
          isActive: input.isActive
        },
        include: { user: { select: { name: true, email: true, isActive: true } }, primaryStore: true }
      });
    });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "EmployeeProfile", entityId: id, action: "UPDATE", newValue: input }
    });
    return response.json({ data: employee });
  });

  router.delete("/employees/:id", requireAuth(secret, [Role.ADMIN]), async (request, response) => {
    const id = String(request.params.id);
    const current = await prisma.employeeProfile.findUnique({ where: { id } });
    if (!current) return response.status(404).json({ error: "Employé introuvable" });
    await prisma.$transaction([
      prisma.employeeProfile.update({ where: { id }, data: { isActive: false } }),
      prisma.user.update({ where: { id: current.userId }, data: { isActive: false } })
    ]);
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "EmployeeProfile", entityId: id, action: "DEACTIVATE", newValue: { isActive: false } }
    });
    return response.status(204).send();
  });

  router.get("/employees/:id/assignments", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const assignments = await prisma.assignment.findMany({
      where: { employeeId: String(request.params.id) },
      include: { store: { select: { id: true, code: true, name: true } } },
      orderBy: { startDate: "desc" }
    });
    response.json({ data: assignments });
  });

  router.post("/employees/:id/assignments", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const employeeId = String(request.params.id);
    const input = assignmentInput.parse(request.body);
    const overlap = await prisma.assignment.findFirst({
      where: {
        employeeId,
        startDate: { lte: input.endDate ?? new Date("9999-12-31") },
        OR: [{ endDate: null }, { endDate: { gte: input.startDate } }]
      }
    });
    if (overlap) return response.status(409).json({ error: "Une affectation existe déjà sur cette période" });
    const assignment = await prisma.assignment.create({
      data: { ...input, employeeId, createdBy: request.auth!.userId },
      include: { store: true }
    });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "Assignment", entityId: assignment.id, action: "CREATE", newValue: input }
    });
    return response.status(201).json({ data: assignment });
  });

  router.get("/attendances", async (request, response) => {
    const query = z.object({ from: z.coerce.date().optional(), to: z.coerce.date().optional() }).parse(request.query);
    const employee = request.auth!.role === Role.EMPLOYEE ? await employeeForUser(request.auth!.userId) : null;
    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: employee?.id,
        createdAt: { gte: query.from, lte: query.to }
      },
      include: {
        employee: { include: { user: { select: { name: true } } } },
        store: { select: { id: true, name: true } },
        shift: true
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    response.json({ data: attendances });
  });

  router.post("/attendances/check-in", requireAuth(secret, [Role.EMPLOYEE]), async (request, response) => {
    const input = z.object({ shiftId: z.string().min(1) }).parse(request.body);
    const employee = await employeeForUser(request.auth!.userId);
    if (!employee) return response.status(404).json({ error: "Profil employé introuvable" });
    const shift = await prisma.scheduleShift.findFirst({
      where: { id: input.shiftId, employeeId: employee.id, status: "PUBLISHED" }
    });
    if (!shift) return response.status(404).json({ error: "Shift publié introuvable" });
    const existing = await prisma.attendance.findUnique({ where: { shiftId: shift.id } });
    if (existing?.checkInAt) return response.status(409).json({ error: "Arrivée déjà pointée" });
    const now = new Date();
    const status = now > new Date(shift.startsAt.getTime() + 10 * 60_000) ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;
    const attendance = await prisma.attendance.upsert({
      where: { shiftId: shift.id },
      update: { checkInAt: now, status },
      create: { employeeId: employee.id, storeId: shift.storeId, shiftId: shift.id, checkInAt: now, status }
    });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "Attendance", entityId: attendance.id, action: "CHECK_IN", newValue: { checkInAt: now, status } }
    });
    return response.status(201).json({ data: attendance });
  });

  router.post("/attendances/check-out", requireAuth(secret, [Role.EMPLOYEE]), async (request, response) => {
    const input = z.object({ shiftId: z.string().min(1) }).parse(request.body);
    const employee = await employeeForUser(request.auth!.userId);
    if (!employee) return response.status(404).json({ error: "Profil employé introuvable" });
    const attendance = await prisma.attendance.findFirst({ where: { shiftId: input.shiftId, employeeId: employee.id } });
    if (!attendance?.checkInAt) return response.status(409).json({ error: "Vous devez d’abord pointer votre arrivée" });
    if (attendance.checkOutAt) return response.status(409).json({ error: "Départ déjà pointé" });
    const updated = await prisma.attendance.update({ where: { id: attendance.id }, data: { checkOutAt: new Date() } });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "Attendance", entityId: updated.id, action: "CHECK_OUT", newValue: { checkOutAt: updated.checkOutAt } }
    });
    return response.json({ data: updated });
  });

  router.post("/attendances/break", requireAuth(secret, [Role.EMPLOYEE]), async (request, response) => {
    const input = z.object({ shiftId: z.string().min(1), action: z.enum(["START", "END"]) }).parse(request.body);
    const employee = await employeeForUser(request.auth!.userId);
    if (!employee) return response.status(404).json({ error: "Profil employé introuvable" });
    const attendance = await prisma.attendance.findFirst({ where: { shiftId: input.shiftId, employeeId: employee.id } });
    if (!attendance?.checkInAt || attendance.checkOutAt) return response.status(409).json({ error: "Aucune présence active pour ce shift" });
    if (input.action === "START" && attendance.breakStartedAt) return response.status(409).json({ error: "Pause déjà démarrée" });
    if (input.action === "END" && (!attendance.breakStartedAt || attendance.breakEndedAt)) return response.status(409).json({ error: "Aucune pause active" });
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: input.action === "START" ? { breakStartedAt: new Date() } : { breakEndedAt: new Date() }
    });
    return response.json({ data: updated });
  });

  router.patch("/attendances/:id/correct", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const id = String(request.params.id);
    const input = z.object({
      checkInAt: z.coerce.date().optional(),
      checkOutAt: z.coerce.date().optional(),
      status: z.nativeEnum(AttendanceStatus),
      correctionReason: z.string().trim().min(5).max(500)
    }).parse(request.body);
    const current = await prisma.attendance.findUnique({ where: { id } });
    if (!current) return response.status(404).json({ error: "Présence introuvable" });
    const updated = await prisma.attendance.update({
      where: { id },
      data: { ...input, correctedBy: request.auth!.userId, status: AttendanceStatus.CORRECTED }
    });
    await prisma.auditLog.create({
      data: {
        actorId: request.auth!.userId, entityType: "Attendance", entityId: id, action: "CORRECT",
        oldValue: { checkInAt: current.checkInAt?.toISOString(), checkOutAt: current.checkOutAt?.toISOString(), status: current.status },
        newValue: { checkInAt: updated.checkInAt?.toISOString(), checkOutAt: updated.checkOutAt?.toISOString(), status: updated.status, reason: input.correctionReason }
      }
    });
    return response.json({ data: updated });
  });

  router.get("/requests", async (request, response) => {
    const employee = request.auth!.role === Role.EMPLOYEE ? await employeeForUser(request.auth!.userId) : null;
    const requests = await prisma.changeRequest.findMany({
      where: { employeeId: employee?.id },
      include: { employee: { include: { user: { select: { name: true } }, primaryStore: { select: { name: true } } } } },
      orderBy: { createdAt: "desc" },
      take: 100
    });
    response.json({ data: requests });
  });

  router.post("/requests", requireAuth(secret, [Role.EMPLOYEE]), async (request, response) => {
    const input = requestInput.parse(request.body);
    const employee = await employeeForUser(request.auth!.userId);
    if (!employee) return response.status(404).json({ error: "Profil employé introuvable" });
    const created = await prisma.changeRequest.create({ data: { ...input, employeeId: employee.id } });
    await prisma.auditLog.create({
      data: { actorId: request.auth!.userId, entityType: "ChangeRequest", entityId: created.id, action: "CREATE", newValue: input }
    });
    const reviewers = await prisma.user.findMany({ where: { role: { in: [Role.ADMIN, Role.STORE_MANAGER] }, isActive: true }, select: { id: true } });
    if (reviewers.length) await prisma.notification.createMany({
      data: reviewers.map((reviewer) => ({
        userId: reviewer.id,
        type: "REQUEST_CREATED" as const,
        title: "Nouvelle demande",
        message: `${employee.user.name} a envoyé une demande.`,
        entityId: created.id
      }))
    });
    return response.status(201).json({ data: created });
  });

  router.patch("/requests/:id/review", requireAuth(secret, [Role.ADMIN, Role.STORE_MANAGER]), async (request, response) => {
    const input = z.object({
      status: z.enum(["APPROVED", "REJECTED"]),
      reviewComment: z.string().trim().min(3).max(500)
    }).parse(request.body);
    const requestId = Array.isArray(request.params.id) ? request.params.id[0] : request.params.id;
    const current = await prisma.changeRequest.findUnique({ where: { id: requestId } });
    if (!current || current.status !== RequestStatus.PENDING) {
      return response.status(409).json({ error: "Cette demande n’est plus en attente" });
    }
    const updated = await prisma.changeRequest.update({
      where: { id: current.id },
      data: { ...input, reviewedBy: request.auth!.userId, reviewedAt: new Date() }
    });
    if (input.status === "APPROVED" && current.shiftId) {
      if (current.requestType === "ABSENCE") {
        await prisma.scheduleShift.update({ where: { id: current.shiftId }, data: { status: "CANCELLED", updatedBy: request.auth!.userId } });
      } else if (current.requestType === "SHIFT_CHANGE" && current.requestedStart && current.requestedEnd) {
        await prisma.scheduleShift.update({
          where: { id: current.shiftId },
          data: { startsAt: current.requestedStart, endsAt: current.requestedEnd, updatedBy: request.auth!.userId }
        });
      }
    }
    const requester = await prisma.employeeProfile.findUnique({ where: { id: current.employeeId } });
    if (requester) await prisma.notification.create({
      data: {
        userId: requester.userId,
        type: "REQUEST_REVIEWED",
        title: input.status === "APPROVED" ? "Demande approuvée" : "Demande refusée",
        message: input.reviewComment,
        entityId: updated.id
      }
    });
    await prisma.auditLog.create({
      data: {
        actorId: request.auth!.userId,
        entityType: "ChangeRequest",
        entityId: updated.id,
        action: "REVIEW",
        oldValue: { status: current.status },
        newValue: input
      }
    });
    return response.json({ data: updated });
  });

  router.get("/notifications", async (request, response) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: request.auth!.userId },
      orderBy: { createdAt: "desc" },
      take: 50
    });
    response.json({ data: notifications });
  });

  router.get("/audit-logs", requireAuth(secret, [Role.ADMIN]), async (request, response) => {
    const query = z.object({
      entityType: z.string().optional(),
      limit: z.coerce.number().int().min(1).max(200).default(50)
    }).parse(request.query);
    const logs = await prisma.auditLog.findMany({
      where: { entityType: query.entityType },
      include: { actor: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      take: query.limit
    });
    response.json({ data: logs });
  });

  router.patch("/notifications/:id/read", async (request, response) => {
    const notification = await prisma.notification.findFirst({
      where: { id: String(request.params.id), userId: request.auth!.userId }
    });
    if (!notification) return response.status(404).json({ error: "Notification introuvable" });
    const updated = await prisma.notification.update({ where: { id: notification.id }, data: { readAt: new Date() } });
    return response.json({ data: updated });
  });

  return router;
}
