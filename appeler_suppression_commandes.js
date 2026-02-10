/**
 * SCRIPT - SUPPRESSION DES COMMANDES "À APPELER" VIA API
 * 
 * Ce script appelle l'API Railway pour supprimer les commandes
 * Vous devez être connecté en tant qu'ADMIN
 */

// ⚠️ CONFIGURATION - Remplacez ces valeurs
const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@afgestion.com'; // Votre email admin
const ADMIN_PASSWORD = 'votre_mot_de_passe'; // Votre mot de passe admin

async function supprimerCommandesAAppeler() {
  console.log('\n🔐 Connexion en tant qu\'admin...\n');

  try {
    // 1. Se connecter et obtenir le token
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
      const error = await loginResponse.json();
      throw new Error(`Échec de connexion : ${error.error || 'Identifiants incorrects'}`);
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion réussie !\n');

    // 2. Appeler la route de suppression
    console.log('🗑️  Suppression des commandes "À appeler"...\n');

    const deleteResponse = await fetch(`${API_URL}/api/orders/delete-a-appeler`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      throw new Error(`Échec de suppression : ${error.error || 'Erreur inconnue'}`);
    }

    const result = await deleteResponse.json();
    
    console.log('═══════════════════════════════════════════════════\n');
    console.log(`✅ ${result.message}\n`);
    console.log(`📊 Nombre de commandes supprimées : ${result.count}\n`);
    
    if (result.deletedReferences && result.deletedReferences.length > 0) {
      console.log('📋 Références supprimées :\n');
      result.deletedReferences.forEach((ref, index) => {
        console.log(`   ${index + 1}. ${ref}`);
      });
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message, '\n');
    throw error;
  }
}

// Exécuter
supprimerCommandesAAppeler()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error.message);
    process.exit(1);
  });














































