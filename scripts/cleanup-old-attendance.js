#!/usr/bin/env node

/**
 * 🗑️ Script de Nettoyage Automatique des Présences
 * 
 * Supprime les enregistrements de présence de plus de 60 jours
 * 
 * Utilisation :
 *   node scripts/cleanup-old-attendance.js
 * 
 * Configurer en Cron (tous les jours à 2h du matin) :
 *   0 2 * * * cd /path/to/project && node scripts/cleanup-old-attendance.js
 */

import { PrismaClient } from '@prisma/client';
import { startOfTodayAppDay } from '../utils/appDayBounds.js';

const prisma = new PrismaClient();

// Configuration
const RETENTION_DAYS = 60; // Conserver 60 jours

async function cleanupOldAttendance() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🗑️  NETTOYAGE AUTOMATIQUE DES PRÉSENCES');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    const todayAbidjan = startOfTodayAppDay();
    const cutoffDate = new Date(todayAbidjan.getTime() - RETENTION_DAYS * 86400000);

    console.log(`📅 Date limite : ${cutoffDate.toLocaleDateString('fr-FR')}`);
    console.log(`📊 Suppression des données avant cette date...\n`);

    // Compter les enregistrements à supprimer
    const countToDelete = await prisma.attendance.count({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });

    if (countToDelete === 0) {
      console.log('✅ Aucune donnée à supprimer.\n');
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }

    console.log(`⚠️  ${countToDelete} enregistrement(s) à supprimer\n`);

    // Supprimer les anciennes données
    const result = await prisma.attendance.deleteMany({
      where: {
        date: {
          lt: cutoffDate
        }
      }
    });

    console.log(`✅ ${result.count} enregistrement(s) supprimé(s) avec succès !\n`);

    // Statistiques finales
    const remainingCount = await prisma.attendance.count();
    console.log(`📊 Statistiques :`);
    console.log(`   Supprimés      : ${result.count}`);
    console.log(`   Restants       : ${remainingCount}`);
    console.log(`   Date limite    : ${cutoffDate.toLocaleDateString('fr-FR')}`);
    console.log(`   Rétention      : ${RETENTION_DAYS} jours\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Nettoyage terminé avec succès !');
    console.log('═══════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erreur lors du nettoyage :', error.message);
    console.error('\n💡 Vérifiez :');
    console.error('   1. La connexion à la base de données (DATABASE_URL)');
    console.error('   2. Les permissions de suppression');
    console.error('   3. Les migrations Prisma appliquées\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
cleanupOldAttendance()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

