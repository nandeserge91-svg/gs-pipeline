#!/usr/bin/env node

/**
 * 📋 Script de Génération Automatique des Absences
 * 
 * Pour chaque employé qui n'a PAS pointé aujourd'hui,
 * crée automatiquement un enregistrement "ABSENT"
 * 
 * Utilisation :
 *   node scripts/generate-daily-absences.js
 * 
 * Configurer en Cron (tous les soirs à 23h) :
 *   0 23 * * * cd /path/to/project && node scripts/generate-daily-absences.js
 */

import { PrismaClient } from '@prisma/client';
import { formatYmdInAppTz, startOfAppDay, endOfAppDay } from '../utils/appDayBounds.js';

const prisma = new PrismaClient();

// Rôles concernés par le pointage
const ROLES_WITH_ATTENDANCE = ['APPELANT', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'];

async function generateDailyAbsences() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📋 GÉNÉRATION AUTOMATIQUE DES ABSENCES');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const ymd = formatYmdInAppTz(new Date());
    const today = startOfAppDay(ymd);
    const todayEnd = endOfAppDay(ymd);

    console.log(`📅 Date (Abidjan) : ${ymd}\n`);

    // 1. Récupérer tous les employés concernés
    const employees = await prisma.user.findMany({
      where: {
        role: {
          in: ROLES_WITH_ATTENDANCE
        }
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        role: true
      }
    });

    console.log(`👥 ${employees.length} employé(s) à vérifier :\n`);

    // 2. Vérifier qui a déjà pointé aujourd'hui
    const existingAttendances = await prisma.attendance.findMany({
      where: {
        date: {
          gte: today,
          lte: todayEnd
        }
      },
      select: {
        userId: true
      }
    });

    const employeesWithAttendance = new Set(existingAttendances.map(a => a.userId));

    // 3. Identifier les absents (ceux qui n'ont pas pointé)
    const absentEmployees = employees.filter(emp => !employeesWithAttendance.has(emp.id));

    console.log(`   ✅ Présents/Pointés : ${employeesWithAttendance.size}`);
    console.log(`   ❌ Absents (non pointés) : ${absentEmployees.length}\n`);

    if (absentEmployees.length === 0) {
      console.log('✅ Tous les employés ont pointé aujourd\'hui !\n');
      console.log('═══════════════════════════════════════════════════════════');
      return { created: 0, employees: [] };
    }

    // 4. Créer les enregistrements d'absence
    console.log('📝 Création des enregistrements d\'absence...\n');

    const absencesCreated = [];

    for (const employee of absentEmployees) {
      try {
        const absence = await prisma.attendance.create({
          data: {
            userId: employee.id,
            date: today,
            heureArrivee: today, // Heure de début de journée
            latitudeArrivee: 0, // Pas de géolocalisation
            longitudeArrivee: 0,
            distanceArrivee: 0,
            validee: false, // NON VALIDÉ
            validation: 'ABSENT', // Statut ABSENT
            note: 'Absence générée automatiquement (pas de pointage)',
            ipAddress: 'system',
            deviceInfo: 'auto-generated'
          }
        });

        absencesCreated.push({
          id: absence.id,
          employee: `${employee.prenom} ${employee.nom}`,
          role: employee.role
        });

        console.log(`   ❌ ${employee.prenom} ${employee.nom} (${employee.role}) → ABSENT`);
      } catch (error) {
        // Si l'absence existe déjà (unique constraint), ignorer
        if (error.code === 'P2002') {
          console.log(`   ⚠️  ${employee.prenom} ${employee.nom} → Déjà enregistré`);
        } else {
          console.error(`   ❌ Erreur pour ${employee.prenom} ${employee.nom}:`, error.message);
        }
      }
    }

    console.log(`\n✅ ${absencesCreated.length} absence(s) créée(s) avec succès !\n`);

    // 5. Statistiques finales
    console.log('📊 Récapitulatif :');
    console.log(`   Total employés       : ${employees.length}`);
    console.log(`   Présents/Pointés     : ${employeesWithAttendance.size}`);
    console.log(`   Absents créés        : ${absencesCreated.length}`);
    console.log(`   Date                 : ${ymd}\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Génération des absences terminée !');
    console.log('═══════════════════════════════════════════════════════════\n');

    return {
      created: absencesCreated.length,
      employees: absencesCreated
    };

  } catch (error) {
    console.error('\n❌ Erreur lors de la génération des absences :', error.message);
    console.error('\n💡 Vérifiez :');
    console.error('   1. La connexion à la base de données (DATABASE_URL)');
    console.error('   2. Les migrations Prisma appliquées');
    console.error('   3. Les permissions d\'insertion\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
generateDailyAbsences()
  .then((result) => {
    console.log(`🎉 Terminé : ${result.created} absence(s) générée(s)`);
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

