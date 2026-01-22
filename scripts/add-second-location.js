#!/usr/bin/env node

/**
 * 📍 Script d'Ajout de la 2ème Localisation
 * 
 * Ajoute une deuxième localisation autorisée pour le pointage
 * 
 * Coordonnées : 5°21'16.9"N 3°52'21.4"W
 * → Latitude  : 5.354706
 * → Longitude : -3.872607
 * 
 * Utilisation :
 *   node scripts/add-second-location.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Coordonnées de la 2ème localisation
const LOCATION_2 = {
  nom: 'Magasin Secondaire Abidjan',
  adresse: 'Abidjan, Côte d\'Ivoire (Site 2)',
  latitude: 5.354706,   // 5°21'16.9"N
  longitude: -3.872607, // 3°52'21.4"W
  rayonTolerance: 75,   // 75 mètres
  heureOuverture: '08:00',
  heureFermeture: '18:00',
  toleranceRetard: 15   // 15 minutes
};

async function addSecondLocation() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('📍 AJOUT DE LA 2ÈME LOCALISATION AUTORISÉE');
  console.log('═══════════════════════════════════════════════════════════\n');

  try {
    // 1. Vérifier les localisations existantes
    const existingLocations = await prisma.storeConfig.findMany();
    
    console.log(`📊 Localisations existantes : ${existingLocations.length}`);
    existingLocations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.nom}`);
      console.log(`      Lat: ${loc.latitude}, Lon: ${loc.longitude}`);
      console.log(`      Rayon: ${loc.rayonTolerance}m\n`);
    });

    // 2. Vérifier si la 2ème localisation existe déjà
    const existing = existingLocations.find(
      loc => Math.abs(loc.latitude - LOCATION_2.latitude) < 0.0001 &&
             Math.abs(loc.longitude - LOCATION_2.longitude) < 0.0001
    );

    if (existing) {
      console.log('⚠️  Cette localisation existe déjà !');
      console.log(`   ID: ${existing.id}, Nom: ${existing.nom}\n`);
      console.log('═══════════════════════════════════════════════════════════');
      return;
    }

    // 3. Ajouter la nouvelle localisation
    console.log('➕ Ajout de la nouvelle localisation...\n');

    const newLocation = await prisma.storeConfig.create({
      data: LOCATION_2
    });

    console.log('✅ Localisation ajoutée avec succès !\n');

    // 4. Afficher le récapitulatif
    console.log('📋 Détails de la nouvelle localisation :');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`ID              : ${newLocation.id}`);
    console.log(`Nom             : ${newLocation.nom}`);
    console.log(`Adresse         : ${newLocation.adresse}`);
    console.log(`Latitude        : ${newLocation.latitude}° (5°21'16.9"N)`);
    console.log(`Longitude       : ${newLocation.longitude}° (3°52'21.4"W)`);
    console.log(`Rayon tolérance : ${newLocation.rayonTolerance}m`);
    console.log(`Heures          : ${newLocation.heureOuverture} - ${newLocation.heureFermeture}`);
    console.log(`Tolérance retard: ${newLocation.toleranceRetard} min`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // 5. Afficher toutes les localisations actives
    const allLocations = await prisma.storeConfig.findMany();
    console.log(`📍 Total de localisations autorisées : ${allLocations.length}\n`);

    allLocations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.nom}`);
      console.log(`      📍 Lat: ${loc.latitude}°, Lon: ${loc.longitude}°`);
      console.log(`      📏 Rayon: ${loc.rayonTolerance}m`);
      console.log(`      🕐 ${loc.heureOuverture} - ${loc.heureFermeture}\n`);
    });

    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Configuration terminée avec succès !');
    console.log('═══════════════════════════════════════════════════════════\n');

    console.log('💡 Les employés peuvent maintenant pointer depuis :');
    allLocations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.nom} (Rayon ${loc.rayonTolerance}m)`);
    });
    console.log('');

  } catch (error) {
    console.error('\n❌ Erreur lors de l\'ajout de la localisation :', error.message);
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
addSecondLocation()
  .then(() => {
    console.log('🎉 Script terminé avec succès !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

