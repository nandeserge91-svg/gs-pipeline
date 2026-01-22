#!/usr/bin/env node

/**
 * 📏 Script de Mise à Jour du Rayon de Tolérance
 * 
 * Met à jour le rayon de tolérance à 75 mètres pour TOUTES les localisations
 * 
 * Utilisation :
 *   node scripts/update-rayon-75m.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NEW_RAYON = 75; // 75 mètres

async function updateRayonTolerance() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📏 MISE À JOUR DU RAYON DE TOLÉRANCE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Afficher la configuration actuelle
    const currentLocations = await prisma.storeConfig.findMany();
    
    console.log(`📊 Configuration actuelle :\n`);
    currentLocations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.nom}`);
      console.log(`      Rayon actuel : ${loc.rayonTolerance}m`);
      console.log(`      Lat: ${loc.latitude}, Lon: ${loc.longitude}\n`);
    });

    if (currentLocations.length === 0) {
      console.log('❌ Aucune localisation trouvée !');
      console.log('   Veuillez d\'abord ajouter une localisation.\n');
      return;
    }

    // 2. Mettre à jour toutes les localisations
    console.log(`➡️  Mise à jour du rayon à ${NEW_RAYON}m...\n`);

    const result = await prisma.storeConfig.updateMany({
      data: {
        rayonTolerance: NEW_RAYON
      }
    });

    console.log(`✅ ${result.count} localisation(s) mise(s) à jour !\n`);

    // 3. Afficher la nouvelle configuration
    const updatedLocations = await prisma.storeConfig.findMany();
    
    console.log('📋 Nouvelle configuration :');
    console.log('═══════════════════════════════════════════════════════════');
    updatedLocations.forEach((loc, index) => {
      console.log(`\n${index + 1}. ${loc.nom}`);
      console.log(`   📏 Rayon de tolérance : ${loc.rayonTolerance}m`);
      console.log(`   📍 Coordonnées : ${loc.latitude}°, ${loc.longitude}°`);
      console.log(`   🕐 Horaires : ${loc.heureOuverture} - ${loc.heureFermeture}`);
    });

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✨ Mise à jour terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log(`💡 Les employés doivent maintenant être à moins de ${NEW_RAYON}m`);
    console.log(`   d'un des magasins pour pointer leur présence.\n`);

  } catch (error) {
    console.error('\n❌ Erreur lors de la mise à jour :', error.message);
    console.error('\n💡 Vérifiez :');
    console.error('   1. La connexion à la base de données (DATABASE_URL)');
    console.error('   2. Les migrations Prisma appliquées');
    console.error('   3. Les permissions de mise à jour\n');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
updateRayonTolerance()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

