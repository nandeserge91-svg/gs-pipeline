// Script pour vérifier si Railway a déployé la dernière version

const API_URL = 'https://gs-pipeline-production.up.railway.app'; // Remplacez par votre URL Railway

async function testDeploiement() {
  console.log('🔍 Vérification du déploiement Railway...\n');
  
  try {
    // Test 1 : Vérifier que l'API est accessible
    console.log('1️⃣ Test connexion API...');
    const response = await fetch(`${API_URL}/health`);
    
    if (response.ok) {
      console.log('   ✅ API accessible\n');
    } else {
      console.log('   ⚠️ API répond avec erreur:', response.status, '\n');
    }
    
    // Test 2 : Vérifier la version (si vous avez un endpoint /version)
    console.log('2️⃣ Vérification version...');
    console.log('   ℹ️ Pour voir la version exacte, vérifiez les logs Railway\n');
    
    console.log('📋 Instructions :');
    console.log('   1. Allez sur https://railway.app/');
    console.log('   2. Ouvrez votre projet');
    console.log('   3. Cliquez sur "Deployments"');
    console.log('   4. Vérifiez que le dernier commit est : 3b97ed9');
    console.log('   5. Le statut doit être : Active (vert)\n');
    
    console.log('⏰ Si le déploiement n\'est pas terminé, attendez encore 2-3 minutes');
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    console.log('\n⚠️ Cela peut signifier que Railway est en train de redémarrer');
    console.log('   Attendez encore 2-3 minutes et réessayez');
  }
}

testDeploiement();

