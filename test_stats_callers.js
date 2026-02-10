/**
 * SCRIPT DE TEST - Stats Appelants API
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function testerStatsCallers() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 TEST API STATS APPELANTS                                ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Connexion
    console.log('🔐 Connexion...\n');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      })
    });

    if (!loginResponse.ok) {
      throw new Error('Échec de connexion');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion réussie\n');

    // 2. Appeler l'API stats/callers
    console.log('📊 Appel de /api/stats/callers...\n');
    
    const statsResponse = await fetch(`${API_URL}/api/stats/callers`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${statsResponse.status}\n`);

    const responseText = await statsResponse.text();
    
    if (!statsResponse.ok) {
      console.error('❌ ERREUR\n');
      console.error('Réponse:', responseText);
      throw new Error(`Erreur ${statsResponse.status}`);
    }

    const data = JSON.parse(responseText);
    
    console.log('✅ RÉPONSE REÇUE\n');
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📋 Structure de la réponse:\n');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Analyser les données
    if (data.callers && Array.isArray(data.callers)) {
      console.log(`📊 Nombre d'appelants: ${data.callers.length}\n`);
      
      if (data.callers.length > 0) {
        console.log('👥 Premiers appelants:\n');
        data.callers.slice(0, 3).forEach((caller, index) => {
          console.log(`   ${index + 1}. ${caller.user?.prenom || 'N/A'} ${caller.user?.nom || 'N/A'}`);
          console.log(`      Total appels: ${caller.totalAppels || 0}`);
          console.log(`      Validées: ${caller.totalValides || 0}`);
          console.log(`      Taux: ${caller.tauxValidation || '0'}%\n`);
        });
      } else {
        console.log('⚠️  Aucun appelant dans les données\n');
      }
    } else {
      console.log('⚠️  Structure inattendue - pas de tableau "callers"\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 TEST TERMINÉ\n');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message, '\n');
    throw error;
  }
}

// Exécuter
testerStatsCallers()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script échoué.\n');
    process.exit(1);
  });









































