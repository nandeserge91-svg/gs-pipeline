/**
 * SCRIPT - VÉRIFIER LES DONNÉES DES COMMANDES
 * 
 * Ce script vérifie si les commandes ont bien le champ noteGestionnaire rempli
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function verifierDonneesCommandes() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🔍 VÉRIFICATION DES DONNÉES DES COMMANDES                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Connexion admin
    console.log('🔐 Connexion admin...');
    
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Échec de connexion admin');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion réussie\n');

    // 2. Récupérer les commandes récentes
    console.log('📋 Récupération des 10 dernières commandes...\n');
    
    const ordersResponse = await fetch(`${API_URL}/api/orders?limit=10`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      throw new Error('Impossible de récupérer les commandes');
    }

    const { orders } = await ordersResponse.json();
    
    console.log(`📦 ${orders.length} commandes récupérées\n`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 3. Analyser chaque commande
    let avecNoteGestionnaire = 0;
    let sansNoteGestionnaire = 0;

    orders.forEach((order, index) => {
      console.log(`${index + 1}. ID: ${order.id} | ${order.clientNom} | ${order.produitNom}`);
      console.log(`   📅 Créée le: ${new Date(order.createdAt).toLocaleString()}`);
      console.log(`   🏷️  Statut: ${order.status}`);
      
      if (order.noteGestionnaire) {
        console.log(`   ✅ noteGestionnaire: "${order.noteGestionnaire}"`);
        avecNoteGestionnaire++;
      } else {
        console.log(`   ❌ noteGestionnaire: vide`);
        sansNoteGestionnaire++;
      }
      
      if (order.noteAppelant) {
        console.log(`   💬 noteAppelant: "${order.noteAppelant}"`);
      }
      
      console.log('');
    });

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 RÉSUMÉ :');
    console.log(`   ✅ Commandes AVEC noteGestionnaire : ${avecNoteGestionnaire}`);
    console.log(`   ❌ Commandes SANS noteGestionnaire : ${sansNoteGestionnaire}`);
    console.log('═══════════════════════════════════════════════════════════════\n');

    if (avecNoteGestionnaire === 0) {
      console.log('⚠️  AUCUNE commande n\'a de noteGestionnaire !\n');
      console.log('💡 SOLUTION :\n');
      console.log('   1. Créez une NOUVELLE commande depuis Google Apps Script');
      console.log('   2. Exécutez testCollantGaine() dans Google Apps Script');
      console.log('   3. Ou créez une commande depuis le formulaire web\n');
    } else {
      console.log(`✅ ${avecNoteGestionnaire} commande(s) ont des détails produit !`);
      console.log('   Ces commandes devraient afficher les détails dans la colonne Note.\n');
    }

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    throw error;
  }
}

// Exécuter
verifierDonneesCommandes()
  .then(() => {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ VÉRIFICATION TERMINÉE                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Vérification échouée :', error.message, '\n');
    process.exit(1);
  });















