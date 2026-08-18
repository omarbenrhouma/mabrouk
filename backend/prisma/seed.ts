import {
  AttendanceStatus, ContractType, NotificationType, PrismaClient,
  RequestStatus, RequestType, Role, ShiftStatus
} from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const DEMO_PASSWORD = "ChangeMe123!";

function day(offset: number, hour: number, minute = 0) {
  const value = new Date();
  value.setDate(value.getDate() + offset);
  value.setHours(hour, minute, 0, 0);
  return value;
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@ayouta.tn" },
    update: { name: "Amira Trabelsi", role: Role.ADMIN, isActive: true },
    create: { id: "demo-admin", name: "Amira Trabelsi", email: "admin@ayouta.tn", passwordHash, role: Role.ADMIN }
  });

  const storeDefinitions = [
    { code: "MBK-TM", name: "Mabrouk Tunisia Mall", address: "Les Berges du Lac 2", city: "Tunis", openingTime: "10:00", closingTime: "22:00", targetStaff: 8 },
    { code: "MBK-MAR", name: "Mabrouk La Marsa", address: "Centre La Marsa", city: "La Marsa", openingTime: "09:00", closingTime: "21:00", targetStaff: 6 },
    { code: "MBK-SOU", name: "Mabrouk Sousse", address: "Centre-ville", city: "Sousse", openingTime: "09:00", closingTime: "21:00", targetStaff: 7 },
    { code: "MBK-BIZ", name: "Mabrouk Bizerte", address: "Centre-ville", city: "Bizerte", openingTime: "09:00", closingTime: "20:00", targetStaff: 5 }
  ];
  const stores = [];
  for (const definition of storeDefinitions) {
    stores.push(await prisma.store.upsert({
      where: { code: definition.code },
      update: { ...definition, isActive: true },
      create: { ...definition, timezone: "Africa/Tunis" }
    }));
  }

  const people = [
    { key: "meriem", name: "Meriem Ben Salah", email: "vendeuse@ayouta.tn", role: Role.EMPLOYEE, contract: ContractType.CDI, hours: 40, title: "Conseillère de vente senior", store: 0 },
    { key: "nour", name: "Nour Ben Amor", email: "nour@mabrouk-demo.tn", role: Role.STORE_MANAGER, contract: ContractType.CDI, hours: 40, title: "Responsable boutique", store: 0 },
    { key: "yassine", name: "Yassine Khelifi", email: "yassine@ayouta.tn", role: Role.EMPLOYEE, contract: ContractType.CDD, hours: 40, title: "Conseiller de vente", store: 0 },
    { key: "ines", name: "Inès Mansour", email: "ines@ayouta.tn", role: Role.EMPLOYEE, contract: ContractType.PART_TIME, hours: 24, title: "Conseillère de vente", store: 1 },
    { key: "sami", name: "Sami Ayari", email: "sami@ayouta.tn", role: Role.EMPLOYEE, contract: ContractType.SEASONAL, hours: 32, title: "Renfort saisonnier", store: 1 },
    { key: "eya", name: "Eya Gharbi", email: "eya@mabrouk-demo.tn", role: Role.STORE_MANAGER, contract: ContractType.CDI, hours: 40, title: "Responsable boutique", store: 2 },
    { key: "rania", name: "Rania Jaziri", email: "rania@mabrouk-demo.tn", role: Role.EMPLOYEE, contract: ContractType.CDI, hours: 40, title: "Visuel merchandiser", store: 2 },
    { key: "aziz", name: "Aziz Chaabane", email: "aziz@mabrouk-demo.tn", role: Role.EMPLOYEE, contract: ContractType.CDD, hours: 40, title: "Conseiller de vente", store: 2 },
    { key: "sarra", name: "Sarra Mzoughi", email: "sarra@mabrouk-demo.tn", role: Role.EMPLOYEE, contract: ContractType.PART_TIME, hours: 20, title: "Conseillère caisse", store: 3 },
    { key: "malek", name: "Malek Bouazizi", email: "malek@mabrouk-demo.tn", role: Role.EMPLOYEE, contract: ContractType.INTERN, hours: 30, title: "Stagiaire vente", store: 3 }
  ];

  const employees = new Map<string, { id: string; userId: string }>();
  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { email: person.email },
      update: { name: person.name, role: person.role, isActive: true },
      create: { id: `demo-user-${person.key}`, name: person.name, email: person.email, passwordHash, role: person.role }
    });
    const profile = await prisma.employeeProfile.upsert({
      where: { userId: user.id },
      update: { contractType: person.contract, weeklyHours: person.hours, jobTitle: person.title, primaryStoreId: stores[person.store]!.id, isActive: true },
      create: {
        id: `demo-employee-${person.key}`, userId: user.id, phone: `+216 2${String(1000000 + people.indexOf(person) * 7311).slice(0, 7)}`,
        contractType: person.contract, weeklyHours: person.hours, jobTitle: person.title,
        availability: { monday: true, tuesday: true, wednesday: true, thursday: true, friday: true, saturday: person.hours >= 30 },
        hireDate: new Date(person.role === Role.STORE_MANAGER ? "2022-03-01" : "2024-02-15"), primaryStoreId: stores[person.store]!.id
      }
    });
    employees.set(person.key, { id: profile.id, userId: user.id });
    if (person.role === Role.STORE_MANAGER) {
      await prisma.store.update({ where: { id: stores[person.store]!.id }, data: { managerId: user.id } });
    }
  }

  const schedule = [
    { key: "meriem", store: 0, start: 10, position: "Conseil femme" }, { key: "yassine", store: 0, start: 14, position: "Caisse" },
    { key: "ines", store: 1, start: 9, position: "Conseil femme" }, { key: "sami", store: 1, start: 13, position: "Renfort" },
    { key: "rania", store: 2, start: 9, position: "Merchandising" }, { key: "aziz", store: 2, start: 13, position: "Conseil homme" },
    { key: "sarra", store: 3, start: 9, position: "Caisse" }, { key: "malek", store: 3, start: 11, position: "Vente" }
  ];
  const shifts = new Map<string, { id: string; employeeId: string; storeId: string; startsAt: Date; endsAt: Date }>();
  for (let offset = -6; offset <= 8; offset++) {
    for (const item of schedule) {
      const employee = employees.get(item.key)!;
      const startsAt = day(offset, item.start);
      const duration = item.key === "ines" || item.key === "sarra" ? 5 : 8;
      const endsAt = day(offset, item.start + duration);
      const id = `demo-shift-${item.key}-${offset + 10}`;
      const existingConflict = await prisma.scheduleShift.findFirst({
        where: {
          id: { not: id }, employeeId: employee.id, status: { not: ShiftStatus.CANCELLED },
          startsAt: { lt: endsAt }, endsAt: { gt: startsAt }
        },
        select: { id: true }
      });
      const status = existingConflict ? ShiftStatus.CANCELLED : ShiftStatus.PUBLISHED;
      const shift = await prisma.scheduleShift.upsert({
        where: { id },
        update: { employeeId: employee.id, storeId: stores[item.store]!.id, startsAt, endsAt, position: item.position, status },
        create: { id, employeeId: employee.id, storeId: stores[item.store]!.id, startsAt, endsAt, breakMins: duration >= 8 ? 45 : 20, position: item.position, status, createdBy: admin.id, updatedBy: admin.id }
      });
      shifts.set(`${item.key}:${offset}`, shift);
    }
  }

  const attendanceScenarios = [
    { key: "meriem", offset: -1, status: AttendanceStatus.PRESENT, delay: 0, early: 0 },
    { key: "yassine", offset: -1, status: AttendanceStatus.LATE, delay: 18, early: 0 },
    { key: "ines", offset: -1, status: AttendanceStatus.PRESENT, delay: -4, early: 0 },
    { key: "sami", offset: -1, status: AttendanceStatus.LEFT_EARLY, delay: 1, early: 42 },
    { key: "rania", offset: -1, status: AttendanceStatus.PRESENT, delay: -2, early: 0 },
    { key: "aziz", offset: -1, status: AttendanceStatus.ABSENT, delay: 0, early: 0 },
    { key: "meriem", offset: -2, status: AttendanceStatus.PRESENT, delay: -3, early: 0 },
    { key: "yassine", offset: -2, status: AttendanceStatus.PRESENT, delay: 2, early: 0 }
  ];
  for (const scenario of attendanceScenarios) {
    const shift = shifts.get(`${scenario.key}:${scenario.offset}`)!;
    const checkInAt = scenario.status === AttendanceStatus.ABSENT ? null : new Date(shift.startsAt.getTime() + scenario.delay * 60_000);
    const checkOutAt = scenario.status === AttendanceStatus.ABSENT ? null : new Date(shift.endsAt.getTime() - scenario.early * 60_000);
    await prisma.attendance.upsert({
      where: { shiftId: shift.id },
      update: { checkInAt, checkOutAt, status: scenario.status, varianceMins: scenario.delay },
      create: { id: `demo-attendance-${scenario.key}-${scenario.offset + 10}`, employeeId: shift.employeeId, storeId: shift.storeId, shiftId: shift.id, checkInAt, checkOutAt, status: scenario.status, varianceMins: scenario.delay }
    });
  }

  const requestDefinitions = [
    { id: "demo-request-absence", key: "ines", type: RequestType.ABSENCE, offset: 4, status: RequestStatus.PENDING, reason: "Rendez-vous médical confirmé" },
    { id: "demo-request-shift", key: "meriem", type: RequestType.SHIFT_CHANGE, offset: 3, status: RequestStatus.PENDING, reason: "Demande de passage sur le shift du matin" },
    { id: "demo-request-approved", key: "sarra", type: RequestType.REPLACEMENT, offset: 5, status: RequestStatus.APPROVED, reason: "Échange convenu avec une collègue" }
  ];
  for (const definition of requestDefinitions) {
    const employee = employees.get(definition.key)!;
    const shift = shifts.get(`${definition.key}:${definition.offset}`);
    await prisma.changeRequest.upsert({
      where: { id: definition.id },
      update: { status: definition.status, reason: definition.reason, requestedDate: day(definition.offset, 12) },
      create: { id: definition.id, employeeId: employee.id, shiftId: shift?.id, requestType: definition.type, requestedDate: day(definition.offset, 12), reason: definition.reason, status: definition.status, reviewedBy: definition.status === RequestStatus.APPROVED ? admin.id : null, reviewedAt: definition.status === RequestStatus.APPROVED ? new Date() : null, reviewComment: definition.status === RequestStatus.APPROVED ? "Organisation validée avec la boutique" : null }
    });
  }

  const meriem = employees.get("meriem")!;
  await prisma.notification.upsert({
    where: { id: "demo-notification-planning" },
    update: { createdAt: new Date(), readAt: null },
    create: { id: "demo-notification-planning", userId: meriem.userId, type: NotificationType.SHIFT_PUBLISHED, title: "Planning publié", message: "Votre planning des prochains jours est disponible.", entityId: shifts.get("meriem:1")?.id }
  });
  await prisma.notification.upsert({
    where: { id: "demo-notification-request" },
    update: { createdAt: new Date(), readAt: null },
    create: { id: "demo-notification-request", userId: admin.id, type: NotificationType.REQUEST_CREATED, title: "Demandes à traiter", message: "Deux demandes nécessitent votre décision.", entityId: "demo-request-absence" }
  });
  await prisma.auditLog.upsert({
    where: { id: "demo-audit-seed" },
    update: { createdAt: new Date(), newValue: { stores: stores.length, employees: employees.size } },
    create: { id: "demo-audit-seed", actorId: admin.id, entityType: "DemoDataset", entityId: "mabrouk", action: "SEED_REFRESH", newValue: { stores: stores.length, employees: employees.size }, comment: "Jeu de données Mabrouk actualisé" }
  });

  console.info(`Jeu de démonstration Mabrouk prêt : ${stores.length} boutiques, ${employees.size} profils, ${shifts.size} shifts.`);
  console.info(`Comptes : admin@ayouta.tn et vendeuse@ayouta.tn / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
