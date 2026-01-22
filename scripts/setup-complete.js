#!/usr/bin/env node

/**
 * 🚀 INSTALLATION COMPLÈTE DU SYSTÈME DE GÉOLOCALISATION
 * 
 * Ce script exécute TOUT automatiquement :
 * 1. Met à jour le rayon de tolérance à 75m
 * 2. Ajoute la 2ème localisation
 * 3. Vérifie la configuration finale
 * 
 * Utilisation :
 *   node scripts/setup-complete.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configuration
const RAYON_TOLERANCE = 75; // 75 mètres

const LOCATION_1 = {
  nom: 'Magasin Principal Abidjan',
  adresse: 'Abidjan, Côte d\'Ivoire',
  latitude: 5.353021,
  longitude: -3.870182,
  rayonTolerance: RAYON_TOLERANCE,
  heureOuverture: '08:00',
  heureFermeture: '18:00',
  toleranceRetard: 15
};

const LOCATION_2 = {
  nom: 'Magasin Secondaire Abidjan',
  adresse: 'Abidjan, Côte d\'Ivoire (Site 2)',
  latitude: 5.354706,
  longitude: -3.872607,
  rayonTolerance: RAYON_TOLERANCE,
  heureOuverture: '08:00',
  heureFermeture: '18:00',
  toleranceRetard: 15
};

async function setupComplete() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║   🚀 INSTALLATION COMPLÈTE DU SYSTÈME DE GÉOLOCALISATION  ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // ÉTAPE 1 : Vérifier la connexion à la base de données
    console.log('📡 Étape 1/5 : Vérification de la connexion à la base de données...\n');
    
    await prisma.$connect();
    console.log('   ✅ Connexion réussie !\n');

    // ÉTAPE 2 : Vérifier les localisations existantes
    console.log('📊 Étape 2/5 : Vérification des localisations existantes...\n');
    
    const existingLocations = await prisma.storeConfig.findMany();
    console.log(`   📍 ${existingLocations.length} localisation(s) trouvée(s)\n`);

    if (existingLocations.length > 0) {
      existingLocations.forEach((loc, index) => {
        console.log(`      ${index + 1}. ${loc.nom}`);
        console.log(`         Rayon: ${loc.rayonTolerance}m`);
        console.log(`         Lat: ${loc.latitude}, Lon: ${loc.longitude}\n`);
      });
    }

    // ÉTAPE 3 : Mettre à jour le rayon à 75m pour toutes les localisations existantes
    console.log(`📏 Étape 3/5 : Mise à jour du rayon de tolérance à ${RAYON_TOLERANCE}m...\n`);
    
    if (existingLocations.length > 0) {
      const updateResult = await prisma.storeConfig.updateMany({
        data: {
          rayonTolerance: RAYON_TOLERANCE
        }
      });
      console.log(`   ✅ ${updateResult.count} localisation(s) mise(s) à jour à ${RAYON_TOLERANCE}m\n`);
    } else {
      console.log('   ⚠️  Aucune localisation existante à mettre à jour\n');
    }

    // ÉTAPE 4 : Ajouter les localisations si elles n'existent pas
    console.log('📍 Étape 4/5 : Ajout des localisations...\n');

    // Localisation 1
    const loc1Exists = existingLocations.find(
      loc => Math.abs(loc.latitude - LOCATION_1.latitude) < 0.0001 &&
             Math.abs(loc.longitude - LOCATION_1.longitude) < 0.0001
    );

    if (!loc1Exists) {
      const loc1 = await prisma.storeConfig.create({ data: LOCATION_1 });
      console.log(`   ✅ Localisation 1 ajoutée : ${loc1.nom}`);
    } else {
      console.log(`   ℹ️  Localisation 1 existe déjà : ${loc1Exists.nom}`);
    }

    // Localisation 2
    const loc2Exists = existingLocations.find(
      loc => Math.abs(loc.latitude - LOCATION_2.latitude) < 0.0001 &&
             Math.abs(loc.longitude - LOCATION_2.longitude) < 0.0001
    );

    if (!loc2Exists) {
      const loc2 = await prisma.storeConfig.create({ data: LOCATION_2 });
      console.log(`   ✅ Localisation 2 ajoutée : ${loc2.nom}\n`);
    } else {
      console.log(`   ℹ️  Localisation 2 existe déjà : ${loc2Exists.nom}\n`);
    }

    // ÉTAPE 5 : Afficher la configuration finale
    console.log('📋 Étape 5/5 : Configuration finale\n');
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  CONFIGURATION FINALE                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const finalLocations = await prisma.storeConfig.findMany({
      orderBy: { id: 'asc' }
    });

    console.log(`📍 Total de localisations actives : ${finalLocations.length}\n`);

    finalLocations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.nom}`);
      console.log(`      📏 Rayon de tolérance : ${loc.rayonTolerance}m`);
      console.log(`      📍 Latitude  : ${loc.latitude}°`);
      console.log(`      📍 Longitude : ${loc.longitude}°`);
      console.log(`      🕐 Horaires  : ${loc.heureOuverture} - ${loc.heureFermeture}`);
      console.log(`      ⏰ Tolérance retard : ${loc.toleranceRetard} min\n`);
    });

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                ✅ INSTALLATION TERMINÉE !                 ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('💡 Les employés peuvent maintenant pointer depuis :');
    finalLocations.forEach((loc, index) => {
      console.log(`   ${index + 1}. ${loc.nom} (Rayon ${loc.rayonTolerance}m)`);
    });
    console.log('');

    console.log('🎯 Prochaines étapes :');
    console.log('   1. Tester le pointage depuis un employé');
    console.log('   2. Vérifier les logs dans Railway');
    console.log('   3. Consulter la page "Présences & Absences"\n');

    return {
      success: true,
      totalLocations: finalLocations.length,
      locations: finalLocations
    };

  } catch (error) {
    console.error('\n╔═══════════════════════════════════════════════════════════╗');
    console.error('║                    ❌ ERREUR FATALE                        ║');
    console.error('╚═══════════════════════════════════════════════════════════╝\n');
    console.error('Détails de l\'erreur :', error.message);
    console.error('\n💡 Vérifications à faire :');
    console.error('   1. DATABASE_URL est-elle configurée ?');
    console.error('   2. Les migrations Prisma sont-elles appliquées ?');
    console.error('   3. La connexion réseau fonctionne-t-elle ?');
    console.error('   4. Les permissions PostgreSQL sont-elles correctes ?\n');
    
    if (error.code === 'P1001') {
      console.error('🔴 Erreur de connexion à la base de données !');
      console.error('   Vérifiez que DATABASE_URL est correctement configurée.\n');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
setupComplete()
  .then((result) => {
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              🎉 SCRIPT TERMINÉ AVEC SUCCÈS !              ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale lors de l\'exécution :', error);
    process.exit(1);
  });

