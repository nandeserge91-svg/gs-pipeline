import cron from 'node-cron';
import prisma from '../config/prisma.js';

const ROLES_WITH_ATTENDANCE = ['APPELANT', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'];

async function generateAbsencesForDate(date, initiatedBy = 'system') {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const targetDateEnd = new Date(targetDate);
  targetDateEnd.setHours(23, 59, 59, 999);

  const employees = await prisma.user.findMany({
    where: { role: { in: ROLES_WITH_ATTENDANCE } },
    select: { id: true, nom: true, prenom: true, role: true }
  });

  const existingAttendances = await prisma.attendance.findMany({
    where: {
      date: {
        gte: targetDate,
        lte: targetDateEnd
      }
    },
    select: { userId: true }
  });

  const employeesWithAttendance = new Set(existingAttendances.map(a => a.userId));
  const absentEmployees = employees.filter(emp => !employeesWithAttendance.has(emp.id));

  if (absentEmployees.length === 0) {
    return { created: 0, totalEmployees: employees.length };
  }

  let created = 0;

  for (const employee of absentEmployees) {
    try {
      await prisma.attendance.create({
        data: {
          userId: employee.id,
          date: targetDate,
          heureArrivee: targetDate,
          latitudeArrivee: 0,
          longitudeArrivee: 0,
          distanceArrivee: 0,
          validee: false,
          validation: 'ABSENT',
          note: `Absence générée automatiquement (pas de pointage) - ${initiatedBy}`,
          ipAddress: 'system',
          deviceInfo: 'auto-generated'
        }
      });
      created += 1;
    } catch (error) {
      if (error.code !== 'P2002') {
        console.error(`Erreur absence ${employee.prenom} ${employee.nom}:`, error.message);
      }
    }
  }

  return { created, totalEmployees: employees.length };
}

export function scheduleAttendanceJobs() {
  if (process.env.ATTENDANCE_CRON_ENABLED === 'false') {
    console.log('⏸️  Attendance cron désactivé (ATTENDANCE_CRON_ENABLED=false)');
    return;
  }

  const timezone = process.env.ATTENDANCE_CRON_TZ || 'Africa/Abidjan';

  cron.schedule(
    '0 23 * * *',
    async () => {
      try {
        console.log('📋 [Cron] Génération automatique des absences...');
        const result = await generateAbsencesForDate(new Date(), 'cron');
        console.log(`✅ [Cron] Absences générées: ${result.created}/${result.totalEmployees}`);
      } catch (error) {
        console.error('❌ [Cron] Erreur génération absences:', error.message);
      }
    },
    { timezone }
  );

  console.log(`✅ Attendance cron activé (23h, TZ=${timezone})`);
}

