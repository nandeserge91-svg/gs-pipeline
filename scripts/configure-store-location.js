/**
 * 📍 SCRIPT DE CONFIGURATION DES COORDONNÉES GPS DU MAGASIN
 * 
 * Ce script permet de configurer ou mettre à jour les coordonnées GPS
 * du magasin pour le système de pointage géolocalisé.
 * 
 * Usage:
 *   node scripts/configure-store-location.js
 * 
 * Ou avec des paramètres:
 *   node scripts/configure-store-location.js --lat=5.3599517 --lon=-4.0082563 --rayon=50
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

// Fonction pour poser des questions
function question(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(query, answer => {
    rl.close();
    resolve(answer);
  }));
}

// Fonction pour valider une coordonnée
function isValidCoordinate(lat, lon) {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);
  
  if (isNaN(latitude) || isNaN(longitude)) {
    return false;
  }
  
  if (latitude < -90 || latitude > 90) {
    return false;
  }
  
  if (longitude < -180 || longitude > 180) {
    return false;
  }
  
  return true;
}

async function configureStoreLocation() {
  console.log('\n📍 ======================================');
  console.log('   CONFIGURATION DU MAGASIN');
  console.log('======================================\n');

  try {
    // Vérifier si une configuration existe déjà
    const existingConfig = await prisma.storeConfig.findFirst();

    if (existingConfig) {
      console.log('📌 Configuration actuelle :');
      console.log(`   Nom: ${existingConfig.nom}`);
      console.log(`   Adresse: ${existingConfig.adresse || 'Non définie'}`);
      console.log(`   Latitude: ${existingConfig.latitude}`);
      console.log(`   Longitude: ${existingConfig.longitude}`);
      console.log(`   Rayon de tolérance: ${existingConfig.rayonTolerance}m`);
      console.log(`   Horaires: ${existingConfig.heureOuverture} - ${existingConfig.heureFermeture}`);
      console.log(`   Tolérance retard: ${existingConfig.toleranceRetard} minutes\n`);

      const update = await question('Voulez-vous mettre à jour la configuration ? (oui/non): ');
      if (update.toLowerCase() !== 'oui' && update.toLowerCase() !== 'o') {
        console.log('✅ Configuration conservée.');
        return;
      }
    }

    // Demander les informations
    console.log('\n📝 Entrez les informations du magasin:\n');
    
    const nom = await question('Nom du magasin (ex: Magasin Principal): ') || existingConfig?.nom || 'Magasin Principal';
    const adresse = await question('Adresse complète (optionnel): ') || existingConfig?.adresse || '';

    console.log('\n📍 Coordonnées GPS:');
    console.log('💡 Astuce: Trouvez vos coordonnées sur Google Maps (clic droit sur votre magasin)\n');
    
    let latitude, longitude;
    let validCoords = false;

    while (!validCoords) {
      const latInput = await question('Latitude (ex: 5.3599517): ') || existingConfig?.latitude;
      const lonInput = await question('Longitude (ex: -4.0082563): ') || existingConfig?.longitude;
      
      if (isValidCoordinate(latInput, lonInput)) {
        latitude = parseFloat(latInput);
        longitude = parseFloat(lonInput);
        validCoords = true;
      } else {
        console.log('❌ Coordonnées invalides. Réessayez.\n');
      }
    }

    const rayonInput = await question('\nRayon de tolérance en mètres (ex: 50): ') || existingConfig?.rayonTolerance || 50;
    const rayonTolerance = parseInt(rayonInput);

    const heureOuverture = await question('Heure d\'ouverture (ex: 08:00): ') || existingConfig?.heureOuverture || '08:00';
    const heureFermeture = await question('Heure de fermeture (ex: 18:00): ') || existingConfig?.heureFermeture || '18:00';

    const toleranceRetardInput = await question('Tolérance de retard en minutes (ex: 15): ') || existingConfig?.toleranceRetard || 15;
    const toleranceRetard = parseInt(toleranceRetardInput);

    // Résumé
    console.log('\n📋 RÉSUMÉ DE LA CONFIGURATION:');
    console.log('================================');
    console.log(`Nom: ${nom}`);
    console.log(`Adresse: ${adresse || 'Non définie'}`);
    console.log(`Latitude: ${latitude}`);
    console.log(`Longitude: ${longitude}`);
    console.log(`Rayon de tolérance: ${rayonTolerance}m`);
    console.log(`Horaires: ${heureOuverture} - ${heureFermeture}`);
    console.log(`Tolérance retard: ${toleranceRetard} minutes`);

    const confirm = await question('\nConfirmer la configuration ? (oui/non): ');
    if (confirm.toLowerCase() !== 'oui' && confirm.toLowerCase() !== 'o') {
      console.log('❌ Configuration annulée.');
      return;
    }

    // Sauvegarder
    let config;
    if (existingConfig) {
      config = await prisma.storeConfig.update({
        where: { id: existingConfig.id },
        data: {
          nom,
          adresse: adresse || null,
          latitude,
          longitude,
          rayonTolerance,
          heureOuverture,
          heureFermeture,
          toleranceRetard
        }
      });
      console.log('\n✅ Configuration mise à jour avec succès !');
    } else {
      config = await prisma.storeConfig.create({
        data: {
          nom,
          adresse: adresse || null,
          latitude,
          longitude,
          rayonTolerance,
          heureOuverture,
          heureFermeture,
          toleranceRetard
        }
      });
      console.log('\n✅ Configuration créée avec succès !');
    }

    console.log('\n📍 Coordonnées enregistrées:');
    console.log(`   ${latitude}, ${longitude}`);
    console.log(`\n🔗 Vérifier sur Google Maps:`);
    console.log(`   https://www.google.com/maps?q=${latitude},${longitude}\n`);

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécution
configureStoreLocation()
  .then(() => {
    console.log('👋 Script terminé.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  });

