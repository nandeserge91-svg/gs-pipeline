/**
 * SCRIPT DE TEST - SUPPRESSION MULTIPLE DE COMMANDES
 * 
 * Ce script teste l'endpoint de suppression multiple
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function testerSuppressionMultiple() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 TEST SUPPRESSION MULTIPLE DE COMMANDES                  ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Connexion admin
    console.log('🔐 Connexion en tant qu\'admin...\n');
    
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
      const error = await loginResponse.text();
      throw new Error(`Échec de connexion admin: ${error}`);
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion réussie !\n');

    // 2. Récupérer les commandes "À appeler"
    console.log('📊 Récupération des commandes "À appeler"...\n');
    
    const ordersResponse = await fetch(`${API_URL}/api/orders?limit=5`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!ordersResponse.ok) {
      const error = await ordersResponse.text();
      throw new Error(`Échec récupération commandes: ${error}`);
    }

    const ordersData = await ordersResponse.json();
    const aAppelerOrders = ordersData.orders.filter(o => 
      o.status === 'NOUVELLE' || o.status === 'A_APPELER'
    );

    console.log(`📋 ${aAppelerOrders.length} commande(s) "À appeler" trouvée(s)\n`);

    if (aAppelerOrders.length === 0) {
      console.log('⚠️  Aucune commande à supprimer. Test terminé.\n');
      return;
    }

    // Afficher les commandes
    aAppelerOrders.forEach((order, index) => {
      console.log(`   ${index + 1}. ID: ${order.id} - ${order.orderReference}`);
      console.log(`      Client: ${order.clientNom}`);
      console.log(`      Statut: ${order.status}`);
      console.log(`      Produit: ${order.produitNom}\n`);
    });

    // 3. Tester la suppression avec les 2 premiers IDs
    const orderIdsToDelete = aAppelerOrders.slice(0, Math.min(2, aAppelerOrders.length)).map(o => o.id);
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`🗑️  Test de suppression de ${orderIdsToDelete.length} commande(s)...\n`);
    console.log('   IDs à supprimer:', orderIdsToDelete);
    console.log('\n⏳ Envoi de la requête...\n');

    const deleteResponse = await fetch(`${API_URL}/api/orders/delete-multiple`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderIds: orderIdsToDelete
      })
    });

    console.log(`📊 Status de la réponse: ${deleteResponse.status}\n`);

    const responseText = await deleteResponse.text();
    console.log('📄 Réponse brute:');
    console.log('─────────────────────────────────────────────────────────────');
    console.log(responseText);
    console.log('─────────────────────────────────────────────────────────────\n');

    if (!deleteResponse.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { error: responseText };
      }

      console.error('❌ ERREUR DÉTECTÉE !\n');
      console.error('📋 Détails de l\'erreur:');
      console.error(JSON.stringify(errorData, null, 2));
      console.error('\n');
      
      throw new Error(`Erreur ${deleteResponse.status}: ${errorData.error || errorData.details || responseText}`);
    }

    const result = JSON.parse(responseText);
    
    console.log('✅ SUPPRESSION RÉUSSIE !\n');
    console.log('📊 Résultat:');
    console.log(`   - Commandes supprimées: ${result.deletedCount || result.count}`);
    if (result.details) {
      console.log(`   - Historique supprimé: ${result.details.history}`);
      console.log(`   - Notifications supprimées: ${result.details.notifications}`);
      console.log(`   - RDV supprimés: ${result.details.rdv}`);
    }
    console.log('\n');

    if (result.deletedReferences && result.deletedReferences.length > 0) {
      console.log('📋 Références supprimées:');
      result.deletedReferences.forEach(ref => {
        console.log(`   - ${ref}`);
      });
      console.log('\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 TEST TERMINÉ AVEC SUCCÈS !\n');

  } catch (error) {
    console.error('\n❌ ERREUR LORS DU TEST :\n');
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
    console.error('\n');
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('💡 SUGGESTIONS DE DÉBOGAGE:\n');
    console.log('1. Vérifier que le backend Railway est bien déployé');
    console.log('2. Vérifier les logs Railway pour plus de détails');
    console.log('3. Vérifier que la route /api/orders/delete-multiple existe');
    console.log('4. Vérifier les permissions (ADMIN uniquement)');
    console.log('5. Vérifier la structure de la base de données\n');
    
    throw error;
  }
}

// Exécuter
testerSuppressionMultiple()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script terminé avec erreur.\n');
    process.exit(1);
  });




