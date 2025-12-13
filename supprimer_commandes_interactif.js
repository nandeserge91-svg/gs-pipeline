/**
 * SCRIPT INTERACTIF - SUPPRESSION DES COMMANDES "À APPELER"
 * 
 * Ce script vous demande vos identifiants au moment de l'exécution
 * Aucun mot de passe n'est stocké dans le fichier
 */

import readline from 'readline';

const API_URL = 'https://gs-pipeline-production.up.railway.app';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, resolve);
  });
}

async function supprimerCommandesAAppeler() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🗑️  SUPPRESSION DES COMMANDES "À APPELER"                 ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Demander les identifiants
    console.log('🔐 Veuillez vous authentifier\n');
    const email = await question('   Email admin : ');
    const password = await question('   Mot de passe : ');
    
    console.log('\n🔐 Connexion en cours...\n');

    // 2. Se connecter
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email.trim(),
        password: password
      })
    });

    if (!loginResponse.ok) {
      const error = await loginResponse.json();
      throw new Error(`Échec de connexion : ${error.error || 'Identifiants incorrects'}`);
    }

    const { token, user } = await loginResponse.json();
    
    console.log(`✅ Connecté en tant que : ${user.prenom} ${user.nom} (${user.role})\n`);

    if (user.role !== 'ADMIN') {
      throw new Error('Vous devez être ADMIN pour supprimer des commandes.');
    }

    // 3. Demander confirmation
    console.log('⚠️  ATTENTION : Cette action est IRRÉVERSIBLE !\n');
    console.log('   Toutes les commandes NOUVELLE et A_APPELER seront supprimées.\n');
    
    const confirmation = await question('   Tapez "SUPPRIMER" pour confirmer : ');
    
    if (confirmation.trim() !== 'SUPPRIMER') {
      console.log('\n❌ Suppression annulée.\n');
      rl.close();
      return;
    }

    // 4. Supprimer les commandes
    console.log('\n🗑️  Suppression en cours...\n');

    const deleteResponse = await fetch(`${API_URL}/api/orders/delete-a-appeler`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!deleteResponse.ok) {
      const error = await deleteResponse.json();
      console.error('\n📋 Détails de l\'erreur serveur :');
      console.error('   Message:', error.error);
      console.error('   Détails:', error.details);
      console.error('   Code:', error.code);
      if (error.meta) {
        console.error('   Meta:', JSON.stringify(error.meta, null, 2));
      }
      throw new Error(`Échec de suppression : ${error.error || 'Erreur inconnue'}`);
    }

    const result = await deleteResponse.json();
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log(`✅ ${result.message}\n`);
    console.log(`📊 Nombre de commandes supprimées : ${result.count}\n`);
    
    if (result.deletedReferences && result.deletedReferences.length > 0) {
      console.log('📋 Références supprimées :\n');
      result.deletedReferences.forEach((ref, index) => {
        console.log(`   ${index + 1}. ${ref}`);
      });
      console.log('');
    }
    
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message, '\n');
    throw error;
  } finally {
    // Fermer readline dans tous les cas
    rl.close();
  }
}

// Exécuter
supprimerCommandesAAppeler()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    // Attendre un peu avant de quitter pour que readline se ferme proprement
    setTimeout(() => process.exit(0), 100);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error.message);
    setTimeout(() => process.exit(1), 100);
  });

