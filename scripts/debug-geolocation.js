#!/usr/bin/env node

/**
 * 🔍 Script de Diagnostic de Géolocalisation
 * 
 * Affiche toutes les informations de débogage :
 * - Localisations configurées en base
 * - Distances calculées
 * - Validation des coordonnées
 * 
 * Utilisation :
 *   node scripts/debug-geolocation.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction de calcul de distance (Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Rayon de la Terre en mètres
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance en mètres
}

async function debugGeolocation() {
  console.log('\n╔═══════════════════════════════════════════════════════════╗');
  console.log('║         🔍 DIAGNOSTIC DE GÉOLOCALISATION                 ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Vérifier la connexion
    console.log('📡 Étape 1/4 : Vérification de la connexion...\n');
    await prisma.$connect();
    console.log('   ✅ Connexion à la base de données réussie !\n');

    // 2. Récupérer les localisations
    console.log('📍 Étape 2/4 : Localisations configurées\n');
    const locations = await prisma.storeConfig.findMany({
      orderBy: { id: 'asc' }
    });

    if (locations.length === 0) {
      console.log('   ❌ AUCUNE LOCALISATION CONFIGURÉE !');
      console.log('   ⚠️  C\'est pour ça que le système ne fonctionne pas !\n');
      console.log('   💡 Solution : Exécutez le script d\'installation :');
      console.log('      node scripts/setup-complete.js\n');
      return;
    }

    console.log(`   ✅ ${locations.length} localisation(s) trouvée(s)\n`);
    console.log('╔═══════════════════════════════════════════════════════════╗');
    
    locations.forEach((loc, index) => {
      console.log(`\n${index + 1}. ${loc.nom}`);
      console.log('───────────────────────────────────────────────────────────');
      console.log(`   ID                : ${loc.id}`);
      console.log(`   Latitude          : ${loc.latitude}°`);
      console.log(`   Longitude         : ${loc.longitude}°`);
      console.log(`   Rayon tolérance   : ${loc.rayonTolerance}m`);
      console.log(`   Horaires          : ${loc.heureOuverture} - ${loc.heureFermeture}`);
      console.log(`   Tolérance retard  : ${loc.toleranceRetard} min`);
    });
    
    console.log('\n╚═══════════════════════════════════════════════════════════╝\n');

    // 3. Simulation de pointage
    console.log('🧪 Étape 3/4 : Simulation de pointage\n');
    console.log('   Testez avec vos coordonnées actuelles :');
    console.log('   (Utilisez Google Maps pour obtenir votre position)\n');

    // Exemples de test avec les coordonnées des magasins
    const testCases = [
      { name: 'Exact Magasin 1', lat: 5.353021, lon: -3.870182 },
      { name: 'Exact Magasin 2', lat: 5.354687, lon: -3.872683 },
      { name: '10m de Magasin 1', lat: 5.353111, lon: -3.870182 },
      { name: '50m de Magasin 1', lat: 5.353471, lon: -3.870182 },
      { name: '100m de Magasin 1', lat: 5.353921, lon: -3.870182 },
    ];

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    TESTS DE DISTANCE                      ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    testCases.forEach(test => {
      console.log(`📍 ${test.name} (${test.lat}, ${test.lon})\n`);
      
      let isValid = false;
      let closestStore = null;
      let minDistance = Infinity;

      locations.forEach(store => {
        const distance = calculateDistance(test.lat, test.lon, store.latitude, store.longitude);
        const valid = distance <= store.rayonTolerance;

        console.log(`   → ${store.nom}`);
        console.log(`      Distance : ${Math.round(distance)}m`);
        console.log(`      Rayon max: ${store.rayonTolerance}m`);
        console.log(`      Résultat : ${valid ? '✅ VALIDÉ' : '❌ REFUSÉ'}\n`);

        if (distance < minDistance) {
          minDistance = distance;
          closestStore = store;
        }

        if (valid) {
          isValid = true;
        }
      });

      console.log(`   🎯 Verdict final : ${isValid ? '✅ PRÉSENT' : '❌ ABSENT'}`);
      console.log(`   📏 Magasin le plus proche : ${closestStore.nom} (${Math.round(minDistance)}m)\n`);
      console.log('───────────────────────────────────────────────────────────\n');
    });

    // 4. Statistiques
    console.log('📊 Étape 4/4 : Statistiques\n');

    const totalAttendances = await prisma.attendance.count();
    const validAttendances = await prisma.attendance.count({
      where: { validee: true }
    });
    const todayAttendances = await prisma.attendance.count({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }
    });

    console.log(`   Total pointages      : ${totalAttendances}`);
    console.log(`   Pointages validés    : ${validAttendances}`);
    console.log(`   Pointages aujourd'hui: ${todayAttendances}\n`);

    // Derniers pointages
    const recentAttendances = await prisma.attendance.findMany({
      take: 5,
      orderBy: { heureArrivee: 'desc' },
      include: {
        user: {
          select: { prenom: true, nom: true }
        }
      }
    });

    if (recentAttendances.length > 0) {
      console.log('   📋 Derniers pointages :\n');
      recentAttendances.forEach((att, index) => {
        const time = new Date(att.heureArrivee).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const status = att.validee ? '✅' : '❌';
        console.log(`      ${index + 1}. ${status} ${att.user.prenom} ${att.user.nom} - ${time} (${Math.round(att.distanceArrivee)}m)`);
      });
      console.log('');
    }

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║                  🎯 RECOMMANDATIONS                       ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    const maxRayon = Math.max(...locations.map(l => l.rayonTolerance));

    if (maxRayon < 100) {
      console.log('   ⚠️  Rayon actuel : ' + maxRayon + 'm');
      console.log('   💡 Pour une meilleure tolérance GPS, augmentez à 100-150m\n');
      console.log('   Commande SQL :');
      console.log('   UPDATE "store_config" SET "rayonTolerance" = 150;\n');
    }

    if (locations.length === 0) {
      console.log('   ❌ Aucune localisation configurée !');
      console.log('   💡 Exécutez : node scripts/setup-complete.js\n');
    }

    if (totalAttendances === 0) {
      console.log('   📊 Aucun pointage enregistré pour le moment');
      console.log('   💡 Testez le système depuis l\'interface web\n');
    }

    console.log('╔═══════════════════════════════════════════════════════════╗');
    console.log('║              ✅ DIAGNOSTIC TERMINÉ                        ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    
    if (error.code === 'P1001') {
      console.error('\n🔴 Impossible de se connecter à la base de données !');
      console.error('   Vérifiez DATABASE_URL dans les variables d\'environnement.\n');
    } else {
      console.error('\n💡 Détails de l\'erreur :');
      console.error('   ', error);
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
debugGeolocation()
  .then(() => {
    console.log('🎉 Diagnostic terminé !\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Erreur fatale :', error);
    process.exit(1);
  });

