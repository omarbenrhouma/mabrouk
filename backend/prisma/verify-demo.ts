import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [stores, employees, shifts, attendances, requests, notifications] = await Promise.all([
    prisma.store.count({ where: { isActive: true } }),
    prisma.employeeProfile.count({ where: { isActive: true } }),
    prisma.scheduleShift.count(),
    prisma.attendance.count(),
    prisma.changeRequest.count(),
    prisma.notification.count()
  ]);
  const overlappingPairs = await prisma.$queryRaw<Array<{ firstId: string; secondId: string; employeeName: string; firstStart: Date; secondStart: Date }>>`
    SELECT a.id AS "firstId", b.id AS "secondId", u.name AS "employeeName",
           a."startsAt" AS "firstStart", b."startsAt" AS "secondStart"
    FROM "ScheduleShift" a
    JOIN "ScheduleShift" b
      ON a."employeeId" = b."employeeId"
     AND a.id < b.id
     AND a.status <> 'CANCELLED'
     AND b.status <> 'CANCELLED'
     AND a."startsAt" < b."endsAt"
     AND a."endsAt" > b."startsAt"
    JOIN "EmployeeProfile" e ON e.id = a."employeeId"
    JOIN "User" u ON u.id = e."userId"
  `;
  const summary = {
    stores,
    employees,
    shifts,
    attendances,
    requests,
    notifications,
    overlappingShiftPairs: overlappingPairs.length,
    overlaps: overlappingPairs
  };
  console.info(JSON.stringify(summary, null, 2));
  if (summary.overlappingShiftPairs > 0) process.exitCode = 2;
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
