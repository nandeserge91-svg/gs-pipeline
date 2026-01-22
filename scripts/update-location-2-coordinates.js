#!/usr/bin/env node

/**
 * 📍 Script de Mise à Jour des Coordonnées de la Localisation 2
 * 
 * Met à jour les coordonnées de la 2ème localisation avec les valeurs exactes
 * de Google Maps
 * 
 * Nouvelles coordonnées :
 *   Latitude  : 5.354687° (5°21'16.9"N)
 *   Longitude : -3.872683° (3°52'21.7"W)
 * 
 * Utilisation :
 *   node scripts/update-location-2-coordinates.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Nouvelles coordonnées exactes de Google Maps
const NEW_COORDINATES = {
  latitude: 5.354687,   // 5°21'16.9"N
  longitude: -3.872683  // 3°52'21.7"W
};

// Anciennes coordonnées approximatives (pour identifier la localisation)
const OLD_COORDINATES = {
  latitude: 5.354706,
  longitude: -3.872607
};

async function updateLocation2Coordinates() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📍 MISE À JOUR DES COORDONNÉES - LOCALISATION 2');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Rechercher la localisation 2 existante
    console.log('🔍 Recherche de la localisation 2...\n');
    
    const locations = await prisma.storeConfig.findMany();
    
    // Chercher par proximité des coordonnées (tolérance de 0.001°)
    const location2 = locations.find(
      loc => Math.abs(loc.latitude - OLD_COORDINATES.latitude) < 0.001 &&
             Math.abs(loc.longitude - OLD_COORDINATES.longitude) < 0.001
    );

    if (!location2) {
      console.log('❌ Localisation 2 non trouvée !');
      console.log('   Coordonnées recherchées : ~5.3547, ~-3.8726');
      console.log('\n💡 Localisations existantes :');
      locations.forEach((loc, index) => {
        console.log(`   ${index + 1}. ${loc.nom}`);
        console.log(`      Lat: ${loc.latitude}, Lon: ${loc.longitude}\n`);
      });
      console.log('⚠️  Utilisez plutôt le script : node scripts/setup-complete.js\n');
      return;
    }

    console.log(`✅ Localisation trouvée : ${location2.nom}`);
    console.log(`   ID : ${location2.id}`);
    console.log(`   Coordonnées actuelles :`);
    console.log(`      Lat: ${location2.latitude}°`);
    console.log(`      Lon: ${location2.longitude}°\n`);

    // 2. Mettre à jour les coordonnées
    console.log('📝 Mise à jour des coordonnées...\n');

    const updated = await prisma.storeConfig.update({
      where: { id: location2.id },
      data: {
        latitude: NEW_COORDINATES.latitude,
        longitude: NEW_COORDINATES.longitude
      }
    });

    console.log('✅ Coordonnées mises à jour avec succès !\n');

    // 3. Afficher la nouvelle configuration
    console.log('📋 Nouvelle configuration :');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`Nom             : ${updated.nom}`);
    console.log(`Latitude        : ${updated.latitude}° (5°21'16.9"N)`);
    console.log(`Longitude       : ${updated.longitude}° (3°52'21.7"W)`);
    console.log(`Rayon tolérance : ${updated.rayonTolerance}m`);
    console.log(`Horaires        : ${updated.heureOuverture} - ${updated.heureFermeture}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // 4. Calculer la différence
    const latDiff = Math.abs(NEW_COORDINATES.latitude - OLD_COORDINATES.latitude);
    const lonDiff = Math.abs(NEW_COORDINATES.longitude - OLD_COORDINATES.longitude);
    const distDiff = Math.sqrt(latDiff * latDiff + lonDiff * lonDiff) * 111000; // Approximation en mètres

    console.log('📊 Différence avec les anciennes coordonnées :');
    console.log(`   Latitude  : ${(latDiff * 1000000).toFixed(0)} µ° (micro-degrés)`);
    console.log(`   Longitude : ${(lonDiff * 1000000).toFixed(0)} µ° (micro-degrés)`);
    console.log(`   Distance  : ~${distDiff.toFixed(1)}m\n`);

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Mise à jour terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('💡 Les employés peuvent maintenant pointer avec les coordonnées exactes.');
    console.log('   La précision GPS est maintenant optimale.\n');

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
updateLocation2Coordinates()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

