/**
 * SCRIPT DE TEST - Vérifier l'état de l'API Railway
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';

async function testerAPI() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🔍 TEST DE L\'API RAILWAY                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Test de base
    console.log('1️⃣  Test de connexion API...\n');
    
    const testResponse = await fetch(`${API_URL}/`);
    const testData = await testResponse.json();
    
    console.log('   ✅ API accessible');
    console.log(`   Version: ${testData.version}`);
    console.log(`   Status: ${testData.status}\n`);

    // 2. Test de connexion admin
    console.log('2️⃣  Test de connexion admin...\n');
    
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@gs-pipeline.com',
        password: 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Échec de connexion admin');
    }

    const { token, user } = await loginResponse.json();
    console.log(`   ✅ Connexion réussie : ${user.prenom} ${user.nom} (${user.role})\n`);

    // 3. Test de la route de suppression (GET pour voir si elle existe)
    console.log('3️⃣  Test des routes de suppression disponibles...\n');
    
    // Tester la route sécurisée
    const testSafeResponse = await fetch(`${API_URL}/api/orders/delete-a-appeler-safe`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   Route /delete-a-appeler-safe : ${testSafeResponse.status === 204 || testSafeResponse.status === 200 ? '✅ Disponible' : '❌ Non disponible'}`);
    
    // Tester la route normale
    const testNormalResponse = await fetch(`${API_URL}/api/orders/delete-a-appeler`, {
      method: 'OPTIONS',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log(`   Route /delete-a-appeler : ${testNormalResponse.status === 204 || testNormalResponse.status === 200 ? '✅ Disponible' : '❌ Non disponible'}\n`);

    // 4. Test réel de suppression avec erreur détaillée
    console.log('4️⃣  Test réel de suppression (route sécurisée)...\n');
    
    const deleteResponse = await fetch(`${API_URL}/api/orders/delete-a-appeler-safe`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const deleteData = await deleteResponse.json();
    
    if (!deleteResponse.ok) {
      console.error('   ❌ Erreur de suppression :');
      console.error('      Status HTTP:', deleteResponse.status);
      console.error('      Message:', deleteData.error);
      console.error('      Détails:', deleteData.details);
      console.error('      Code:', deleteData.code);
      if (deleteData.meta) {
        console.error('      Meta:', JSON.stringify(deleteData.meta, null, 2));
      }
    } else {
      console.log('   ✅ Suppression réussie !');
      console.log(`      Commandes supprimées: ${deleteData.count}`);
      if (deleteData.details) {
        console.log(`      - Commandes: ${deleteData.details.orders}`);
        console.log(`      - Historique: ${deleteData.details.history}`);
        console.log(`      - Notifications: ${deleteData.details.notifications}`);
      }
      if (deleteData.deletedReferences && deleteData.deletedReferences.length > 0) {
        console.log('\n   📋 Références supprimées:');
        deleteData.deletedReferences.forEach((ref, i) => {
          console.log(`      ${i + 1}. ${ref}`);
        });
      }
    }

    console.log('\n══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Erreur:', error.message, '\n');
    throw error;
  }
}

// Exécuter
testerAPI()
  .then(() => {
    console.log('✅ Test terminé.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale:', error.message);
    process.exit(1);
  });
































