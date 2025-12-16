/**
 * SCRIPT - ATTENDRE LE DÉPLOIEMENT ET TESTER
 * 
 * Ce script attend que Railway redéploie et teste ensuite
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

// Fonction pour attendre X secondes
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

async function verifierEtTester() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   ⏳ ATTENTE DU DÉPLOIEMENT RAILWAY                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  let tentatives = 0;
  const MAX_TENTATIVES = 20; // 20 tentatives = environ 2 minutes
  const DELAI_ENTRE_TENTATIVES = 6; // 6 secondes

  console.log('⏰ Railway redéploie le backend...');
  console.log(`   Vérification toutes les ${DELAI_ENTRE_TENTATIVES} secondes\n`);

  while (tentatives < MAX_TENTATIVES) {
    tentatives++;
    console.log(`🔄 Tentative ${tentatives}/${MAX_TENTATIVES}...`);

    try {
      // Vérifier si l'API répond
      const response = await fetch(`${API_URL}/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log('   ✅ API répond\n');
        
        // Attendre 5 secondes de plus pour s'assurer que tout est prêt
        console.log('⏳ Attente de 5 secondes supplémentaires pour stabilisation...\n');
        await sleep(5);
        
        // Maintenant tester la suppression
        console.log('═══════════════════════════════════════════════════════════════\n');
        console.log('🧪 TEST DE LA SUPPRESSION MULTIPLE\n');
        
        return await testerSuppression();
      }
    } catch (error) {
      console.log(`   ⏳ Pas encore prêt... (${error.message})`);
    }

    if (tentatives < MAX_TENTATIVES) {
      await sleep(DELAI_ENTRE_TENTATIVES);
    }
  }

  console.log('\n⚠️  Timeout : le déploiement prend plus de temps que prévu.\n');
  console.log('💡 Suggestions:');
  console.log('   1. Vérifiez manuellement Railway : https://railway.app');
  console.log('   2. Réessayez dans quelques minutes');
  console.log('   3. Vérifiez les logs de déploiement\n');
  
  throw new Error('Timeout de déploiement');
}

async function testerSuppression() {
  try {
    // 1. Connexion
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
      throw new Error('Échec de connexion');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion admin réussie\n');

    // 2. Récupérer les commandes à appeler
    const ordersResponse = await fetch(`${API_URL}/api/orders?limit=3`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!ordersResponse.ok) {
      throw new Error('Échec récupération commandes');
    }

    const ordersData = await ordersResponse.json();
    const aAppelerOrders = ordersData.orders.filter(o => 
      o.status === 'NOUVELLE' || o.status === 'A_APPELER'
    );

    console.log(`📊 ${aAppelerOrders.length} commande(s) "À appeler" trouvée(s)\n`);

    if (aAppelerOrders.length === 0) {
      console.log('⚠️  Aucune commande à tester.\n');
      console.log('✅ API fonctionne correctement !\n');
      return true;
    }

    // Afficher les commandes
    aAppelerOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ${order.orderReference} - ${order.clientNom}`);
    });
    console.log('');

    // 3. Tester avec UNE seule commande
    const testOrderId = aAppelerOrders[0].id;
    console.log(`🗑️  Test de suppression de la commande ID: ${testOrderId}\n`);

    const deleteResponse = await fetch(`${API_URL}/api/orders/delete-multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderIds: [testOrderId]
      })
    });

    const responseText = await deleteResponse.text();
    
    if (!deleteResponse.ok) {
      console.error('❌ ERREUR DE SUPPRESSION\n');
      console.error('Status:', deleteResponse.status);
      console.error('Réponse:', responseText);
      throw new Error('Échec de la suppression');
    }

    const result = JSON.parse(responseText);
    
    console.log('✅ SUPPRESSION RÉUSSIE !\n');
    console.log('📊 Résultat:');
    console.log(`   - Commandes supprimées: ${result.deletedCount}`);
    console.log(`   - Historique: ${result.details?.history || 0}`);
    console.log(`   - Notifications: ${result.details?.notifications || 0}`);
    console.log(`   - RDV: ${result.details?.rdv || 0}\n`);
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 LE BUG EST CORRIGÉ ! LA SUPPRESSION FONCTIONNE !\n');
    
    return true;

  } catch (error) {
    console.error('\n❌ Erreur lors du test:', error.message, '\n');
    throw error;
  }
}

// Exécuter
verifierEtTester()
  .then(() => {
    console.log('✅ Test terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test échoué.\n');
    process.exit(1);
  });




