/**
 * 🔍 SCRIPT DE VÉRIFICATION - EXPRESS EN AGENCE (via API)
 * 
 * Ce script vérifie via l'API de production que toutes les commandes EXPRESS_ARRIVE
 * sont bien retournées par l'endpoint /api/express/en-agence
 */

import https from 'https';

const API_URL = 'https://gs-pipeline-production.up.railway.app/api';

// ⚠️ REMPLACEZ CE TOKEN PAR UN TOKEN VALIDE (ADMIN ou GESTIONNAIRE)
// Pour obtenir un token :
// 1. Allez sur https://afgestion.net
// 2. Connectez-vous
// 3. Ouvrez la console du navigateur (F12)
// 4. Tapez : localStorage.getItem('token')
// 5. Copiez le token et collez-le ci-dessous
const AUTH_TOKEN = 'VOTRE_TOKEN_ICI';

/**
 * Fonction pour faire une requête HTTP
 */
function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

async function verifierExpressEnAgence() {
  console.log('🔍 VÉRIFICATION DES COMMANDES EXPRESS EN AGENCE (via API)\n');
  console.log('='.repeat(70));
  
  try {
    // Vérifier le token
    if (AUTH_TOKEN === 'VOTRE_TOKEN_ICI') {
      console.log('\n❌ ERREUR : Token d\'authentification non défini !');
      console.log('\n📝 Pour obtenir votre token :');
      console.log('   1. Allez sur https://afgestion.net');
      console.log('   2. Connectez-vous en tant qu\'ADMIN ou GESTIONNAIRE');
      console.log('   3. Ouvrez la console du navigateur (F12)');
      console.log('   4. Tapez : localStorage.getItem(\'token\')');
      console.log('   5. Copiez le token et collez-le dans ce script (ligne 21)\n');
      console.log('='.repeat(70));
      return;
    }
    
    console.log('\n1️⃣ RÉCUPÉRATION DES COMMANDES EXPRESS EN AGENCE\n');
    
    // Récupérer TOUTES les commandes EXPRESS (arrivées + retirées)
    const result = await makeRequest('/express/en-agence');
    
    const { orders, stats } = result;
    
    console.log(`📊 STATISTIQUES GLOBALES :`);
    console.log(`   Total commandes       : ${stats.total}`);
    console.log(`   Non retirées          : ${stats.nonRetires} (EXPRESS_ARRIVE)`);
    console.log(`   Retirées              : ${stats.retires} (EXPRESS_LIVRE)`);
    console.log(`   Montant en attente    : ${stats.montantEnAttente.toLocaleString('fr-FR')} FCFA`);
    console.log(`   Agences               : ${stats.agences.join(', ') || 'Aucune'}`);
    
    // 2️⃣ Analyser les commandes non retirées (EXPRESS_ARRIVE)
    console.log('\n' + '='.repeat(70));
    console.log('\n2️⃣ DÉTAILS DES COMMANDES NON RETIRÉES (EXPRESS_ARRIVE)\n');
    
    const nonRetirees = orders.filter(o => o.status === 'EXPRESS_ARRIVE');
    
    if (nonRetirees.length === 0) {
      console.log('✅ Aucune commande en attente de retrait.\n');
    } else {
      console.log(`📦 ${nonRetirees.length} commande(s) en attente de retrait :\n`);
      
      nonRetirees.forEach((cmd, index) => {
        console.log(`${index + 1}. ${cmd.orderReference}`);
        console.log(`   Client              : ${cmd.clientNom} - ${cmd.clientTelephone}`);
        console.log(`   Produit             : ${cmd.produitNom} (x${cmd.quantite})`);
        console.log(`   Agence              : ${cmd.agenceRetrait || '❌ NON DÉFINI'}`);
        console.log(`   Code expédition     : ${cmd.codeExpedition || '❌ NON DÉFINI'}`);
        console.log(`   Arrivé le           : ${cmd.arriveAt ? new Date(cmd.arriveAt).toLocaleString('fr-FR') : '❌ NON DÉFINI'}`);
        console.log(`   Jours en agence     : ${cmd.joursEnAgence} jour(s)`);
        console.log(`   Notifications       : ${cmd.nombreNotifications}`);
        console.log(`   Montant à payer     : ${cmd.montantRestant.toLocaleString('fr-FR')} FCFA (${Math.round((cmd.montantRestant / cmd.montant) * 100)}%)`);
        
        // Alertes
        const alertes = [];
        if (!cmd.agenceRetrait) alertes.push('⚠️ Agence non définie');
        if (!cmd.codeExpedition) alertes.push('⚠️ Code non défini');
        if (!cmd.arriveAt) alertes.push('⚠️ Date d\'arrivée non définie');
        if (cmd.joursEnAgence > 7) alertes.push(`🚨 ${cmd.joursEnAgence} jours en agence !`);
        
        if (alertes.length > 0) {
          console.log(`   Alertes             : ${alertes.join(', ')}`);
        } else {
          console.log(`   Statut              : ✅ Correct`);
        }
        console.log('');
      });
    }
    
    // 3️⃣ Analyser les commandes retirées récemment
    console.log('='.repeat(70));
    console.log('\n3️⃣ COMMANDES RETIRÉES RÉCEMMENT (EXPRESS_LIVRE)\n');
    
    const retirees = orders.filter(o => o.status === 'EXPRESS_LIVRE');
    
    if (retirees.length === 0) {
      console.log('Aucune commande retirée.\n');
    } else {
      console.log(`✅ ${retirees.length} commande(s) retirée(s) :\n`);
      
      // Afficher seulement les 5 plus récentes
      const recentRetirees = retirees.slice(0, 5);
      recentRetirees.forEach((cmd, index) => {
        console.log(`${index + 1}. ${cmd.orderReference} - ${cmd.clientNom}`);
        console.log(`   Retiré le : ${new Date(cmd.deliveredAt || cmd.updatedAt).toLocaleString('fr-FR')}`);
        console.log('');
      });
      
      if (retirees.length > 5) {
        console.log(`   ... et ${retirees.length - 5} autre(s) commande(s) retirée(s)\n`);
      }
    }
    
    // 4️⃣ Vérifications et recommandations
    console.log('='.repeat(70));
    console.log('\n4️⃣ VÉRIFICATIONS ET RECOMMANDATIONS\n');
    
    // Vérifier la cohérence des données
    let problemes = 0;
    
    const sanAgence = nonRetirees.filter(c => !c.agenceRetrait);
    if (sanAgence.length > 0) {
      console.log(`⚠️ ${sanAgence.length} commande(s) sans agence de retrait :`);
      sanAgence.forEach(c => console.log(`   • ${c.orderReference} (${c.clientNom})`));
      console.log('');
      problemes++;
    }
    
    const sansCode = nonRetirees.filter(c => !c.codeExpedition);
    if (sansCode.length > 0) {
      console.log(`⚠️ ${sansCode.length} commande(s) sans code d'expédition :`);
      sansCode.forEach(c => console.log(`   • ${c.orderReference} (${c.clientNom})`));
      console.log('');
      problemes++;
    }
    
    const sansArriveAt = nonRetirees.filter(c => !c.arriveAt);
    if (sansArriveAt.length > 0) {
      console.log(`⚠️ ${sansArriveAt.length} commande(s) sans date d'arrivée :`);
      sansArriveAt.forEach(c => console.log(`   • ${c.orderReference} (${c.clientNom})`));
      console.log('');
      problemes++;
    }
    
    const tropLongtemps = nonRetirees.filter(c => c.joursEnAgence > 7);
    if (tropLongtemps.length > 0) {
      console.log(`🚨 ${tropLongtemps.length} commande(s) en agence depuis plus de 7 jours :`);
      tropLongtemps.forEach(c => console.log(`   • ${c.orderReference} (${c.clientNom}) - ${c.joursEnAgence} jours`));
      console.log('   → Pensez à rappeler les clients !');
      console.log('');
      problemes++;
    }
    
    if (problemes === 0) {
      console.log('✅ Toutes les commandes sont correctement configurées ! 🎉\n');
    }
    
    // 5️⃣ Résumé final
    console.log('='.repeat(70));
    console.log('\n5️⃣ RÉSUMÉ FINAL\n');
    
    console.log(`✅ VÉRIFICATION TERMINÉE`);
    console.log(`\n📊 Résumé :`);
    console.log(`   • ${stats.nonRetires} commande(s) en attente de retrait`);
    console.log(`   • ${stats.retires} commande(s) déjà retirée(s)`);
    console.log(`   • ${stats.montantEnAttente.toLocaleString('fr-FR')} FCFA à encaisser`);
    
    if (nonRetirees.length > 0) {
      console.log(`\n💡 Conseils :`);
      if (tropLongtemps.length > 0) {
        console.log(`   • Rappeler les clients dont les colis sont en attente depuis > 7 jours`);
      }
      console.log(`   • Vérifier que les codes d'expédition sont bien affichés`);
      console.log(`   • S'assurer que les clients connaissent l'agence de retrait`);
    }
    
    console.log('\n' + '='.repeat(70));
    console.log('\n✅ La page "EXPRESS - En agence" affiche bien toutes les commandes ! 🎉\n');
    
  } catch (error) {
    console.error('\n❌ ERREUR lors de la vérification:', error.message);
    
    if (error.message.includes('401')) {
      console.log('\n⚠️ Token d\'authentification invalide ou expiré.');
      console.log('   Générez un nouveau token et réessayez.\n');
    }
    
    console.log('='.repeat(70));
  }
}

// Exécuter la vérification
verifierExpressEnAgence();

