#!/usr/bin/env node

/**
 * 🚀 Configuration Rapide - Magasin Abidjan
 * 
 * Coordonnées GPS exactes du magasin :
 * Latitude: 5.353021 (5°21'10.9"N)
 * Longitude: -3.870182 (3°52'12.7"W)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setupAbidjanStore() {
  console.log('🚀 Configuration du magasin à Abidjan...\n');

  const config = {
    nom: 'Magasin Principal Abidjan',
    adresse: 'Abidjan, Côte d\'Ivoire',
    latitude: 5.353021,   // 5°21'10.9"N
    longitude: -3.870182, // 3°52'12.7"W
    rayonTolerance: 50,   // 50 mètres
    heureOuverture: '08:00',
    heureFermeture: '18:00',
    toleranceRetard: 15   // 15 minutes
  };

  try {
    // Vérifier si une config existe déjà
    const existingConfig = await prisma.storeConfig.findFirst();

    let storeConfig;
    if (existingConfig) {
      console.log('📝 Mise à jour de la configuration existante...\n');
      storeConfig = await prisma.storeConfig.update({
        where: { id: existingConfig.id },
        data: config
      });
    } else {
      console.log('🆕 Création d\'une nouvelle configuration...\n');
      storeConfig = await prisma.storeConfig.create({
        data: config
      });
    }

    console.log('✅ Configuration réussie !\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📍 Nom        : ${storeConfig.nom}`);
    console.log(`📍 Adresse    : ${storeConfig.adresse}`);
    console.log(`📍 Latitude   : ${storeConfig.latitude}° (5°21'10.9"N)`);
    console.log(`📍 Longitude  : ${storeConfig.longitude}° (3°52'12.7"W)`);
    console.log(`📏 Rayon      : ${storeConfig.rayonTolerance}m`);
    console.log(`🕐 Ouverture  : ${storeConfig.heureOuverture}`);
    console.log(`🕐 Fermeture  : ${storeConfig.heureFermeture}`);
    console.log(`⏰ Tolérance  : ${storeConfig.toleranceRetard} minutes`);
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('🎉 Le système de géolocalisation est maintenant configuré !');
    console.log('👉 Les employés peuvent maintenant pointer leur présence.\n');

  } catch (error) {
    console.error('❌ Erreur lors de la configuration :', error.message);
    console.error('\n💡 Conseils :');
    console.error('   1. Vérifiez que la base de données est accessible');
    console.error('   2. Vérifiez que les migrations sont appliquées');
    console.error('   3. Vérifiez votre DATABASE_URL dans .env\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
setupAbidjanStore()
  .then(() => {
    console.log('✨ Configuration terminée avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

