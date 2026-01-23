#!/usr/bin/env node

/**
 * 🔧 CORRECTION RAPIDE - Configurer les localisations sur Railway
 * 
 * Ce script se connecte à votre base de données Railway et configure
 * les 2 localisations d'Abidjan avec un rayon de 75m.
 * 
 * Utilisation sur Railway :
 *   railway run node scripts/fix-geolocation-railway.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixGeolocation() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║  🔧 CORRECTION GÉOLOCALISATION - RAILWAY                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // Connexion
    console.log('📡 Connexion à la base de données...\n');
    await prisma.$connect();
    console.log('   ✅ Connecté !\n');

    // Vérifier l'état actuel
    console.log('📊 Vérification de l\'état actuel...\n');
    const existingLocations = await prisma.storeConfig.findMany();
    
    console.log(`   → ${existingLocations.length} localisation(s) trouvée(s)\n`);

    if (existingLocations.length > 0) {
      console.log('   Localisations existantes :\n');
      existingLocations.forEach((loc, i) => {
        console.log(`   ${i + 1}. ${loc.nom}`);
        console.log(`      Lat: ${loc.latitude}, Lon: ${loc.longitude}`);
        console.log(`      Rayon: ${loc.rayonTolerance}m\n`);
      });

      const shouldDelete = true; // Remplacer automatiquement
      
      if (shouldDelete) {
        console.log('   🗑️  Suppression des anciennes localisations...\n');
        await prisma.storeConfig.deleteMany({});
        console.log('   ✅ Supprimées !\n');
      }
    }

    // Insérer les nouvelles localisations
    console.log('➕ Insertion des 2 localisations d\'Abidjan...\n');

    const location1 = await prisma.storeConfig.create({
      data: {
        nom: 'Magasin Principal Abidjan',
        adresse: 'Abidjan, Côte d\'Ivoire',
        latitude: 5.353021,
        longitude: -3.870182,
        rayonTolerance: 75,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15
      }
    });

    console.log(`   ✅ ${location1.nom} créé !`);
    console.log(`      ID: ${location1.id}`);
    console.log(`      Lat: ${location1.latitude}°`);
    console.log(`      Lon: ${location1.longitude}°`);
    console.log(`      Rayon: ${location1.rayonTolerance}m\n`);

    const location2 = await prisma.storeConfig.create({
      data: {
        nom: 'Magasin Secondaire Abidjan',
        adresse: 'Abidjan, Côte d\'Ivoire (Site 2)',
        latitude: 5.354687,
        longitude: -3.872683,
        rayonTolerance: 75,
        heureOuverture: '08:00',
        heureFermeture: '18:00',
        toleranceRetard: 15
      }
    });

    console.log(`   ✅ ${location2.nom} créé !`);
    console.log(`      ID: ${location2.id}`);
    console.log(`      Lat: ${location2.latitude}°`);
    console.log(`      Lon: ${location2.longitude}°`);
    console.log(`      Rayon: ${location2.rayonTolerance}m\n`);

    // Vérification finale
    console.log('✅ Vérification finale...\n');
    const allLocations = await prisma.storeConfig.findMany();
    
    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║         📍 LOCALISATIONS CONFIGURÉES                     ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    allLocations.forEach((loc, i) => {
      console.log(`${i + 1}. ${loc.nom}`);
      console.log(`   📍 Lat: ${loc.latitude}°, Lon: ${loc.longitude}°`);
      console.log(`   📏 Rayon: ${loc.rayonTolerance}m`);
      console.log(`   🕐 Horaires: ${loc.heureOuverture} - ${loc.heureFermeture}`);
      console.log(`   ⏰ Tolérance retard: ${loc.toleranceRetard} min\n`);
    });

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              🎉 CONFIGURATION RÉUSSIE !                  ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('📱 Prochaine étape :');
    console.log('   → Testez le pointage sur https://afgestion.net');
    console.log('   → Vous devez être à moins de 75m d\'un des magasins\n');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    
    if (error.code === 'P2002') {
      console.error('\n⚠️  Une localisation avec cet ID existe déjà.');
      console.error('   Solution : Relancez le script, il va remplacer automatiquement.\n');
    } else if (error.code === 'P1001') {
      console.error('\n🔴 Impossible de se connecter à la base de données !');
      console.error('   Vérifiez DATABASE_URL dans les variables d\'environnement Railway.\n');
    } else {
      console.error('\n💡 Détails :');
      console.error(error);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
fixGeolocation()
  .then(() => {
    console.log('✅ Script terminé avec succès !\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

