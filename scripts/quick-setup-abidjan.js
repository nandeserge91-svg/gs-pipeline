/**
 * 📍 CONFIGURATION RAPIDE - MAGASIN ABIDJAN
 * 
 * Ce script configure automatiquement les coordonnées GPS du magasin à Abidjan
 * Coordonnées: 5°21'10.9"N 3°52'12.7"W (5.353021, -3.870182)
 * 
 * Usage: node scripts/quick-setup-abidjan.js
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAbidjanStore() {
  console.log('\n📍 ==========================================');
  console.log('   CONFIGURATION MAGASIN - ABIDJAN');
  console.log('==========================================\n');

  try {
    // Supprimer l'ancienne config si elle existe
    await prisma.storeConfig.deleteMany();
    console.log('🗑️  Ancienne configuration supprimée...\n');

    // Créer la nouvelle configuration
    const config = await prisma.storeConfig.create({
      data: {
        nom: 'GS Pipeline - Abidjan',
        adresse: 'Abidjan, Côte d\'Ivoire',
        latitude: 5.353021,
        longitude: -3.870182,
        rayonTolerance: 50,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15,
        joursOuvres: '["lundi","mardi","mercredi","jeudi","vendredi","samedi"]'
      }
    });

    console.log('✅ Configuration créée avec succès !\n');
    console.log('📋 DÉTAILS:');
    console.log('===========');
    console.log(`   Nom          : ${config.nom}`);
    console.log(`   Adresse      : ${config.adresse}`);
    console.log(`   Latitude     : ${config.latitude}`);
    console.log(`   Longitude    : ${config.longitude}`);
    console.log(`   Rayon tolérance : ${config.rayonTolerance}m`);
    console.log(`   Horaires     : ${config.heureOuverture} - ${config.heureFermeture}`);
    console.log(`   Tolérance retard : ${config.toleranceRetard} minutes\n`);

    console.log('🔗 Vérifier sur Google Maps:');
    console.log(`   https://www.google.com/maps?q=${config.latitude},${config.longitude}\n`);

    console.log('✅ SYSTÈME DE POINTAGE PRÊT À L\'EMPLOI !\n');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
setupAbidjanStore()
  .then(() => {
    console.log('👋 Configuration terminée avec succès !\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

