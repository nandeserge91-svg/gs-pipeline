/**
 * SCRIPT - CRÉER PLUSIEURS LIVREURS EN BATCH
 * 
 * Ce script crée plusieurs comptes livreurs automatiquement
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

// Liste des livreurs à créer
const LIVREURS = [
  'djakis',
  'souley',
  'mobio',
  'joellivreur',
  'juniorlivreur',
  'fami',
  'moise',
  'fousseni',
  'ariel',
  'assoh',
  'tanoh',
  'kouame',
  'bako'
];

// Mot de passe par défaut pour tous les livreurs
const DEFAULT_PASSWORD = 'livreur123';

async function creerLivreursBatch() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   📦 CRÉATION DES LIVREURS EN BATCH                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
  console.log(`📊 Nombre de livreurs à créer : ${LIVREURS.length}\n`);

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
      throw new Error('Échec de connexion admin');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion réussie !\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 2. Créer chaque livreur
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < LIVREURS.length; i++) {
      const prenom = LIVREURS[i];
      const email = `${prenom}@gmail.com`;
      
      console.log(`${i + 1}/${LIVREURS.length} - Création de "${prenom}"...`);
      
      try {
        const createResponse = await fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            prenom: prenom,
            nom: '-',  // Le backend exige un nom non vide
            email: email,
            telephone: '',
            password: DEFAULT_PASSWORD,
            role: 'LIVREUR'
          })
        });

        if (!createResponse.ok) {
          const errorText = await createResponse.text();
          let errorMessage = 'Erreur inconnue';
          
          try {
            const error = JSON.parse(errorText);
            errorMessage = error.error || error.message || errorText;
          } catch {
            errorMessage = errorText;
          }
          
          console.log(`   ❌ Erreur: ${errorMessage}`);
          console.log(`      Status: ${createResponse.status}\n`);
          
          // Vérifier si c'est une erreur de doublon
          if (errorMessage.includes('existe déjà')) {
            errorCount++;
            errors.push({ prenom, email, reason: 'Déjà existant' });
          } else {
            errorCount++;
            errors.push({ prenom, email, reason: errorMessage });
          }
        } else {
          const newUser = await createResponse.json();
          console.log(`   ✅ Créé avec succès ! ID: ${newUser.id}`);
          console.log(`      Email: ${email}`);
          console.log(`      Mot de passe: ${DEFAULT_PASSWORD}\n`);
          successCount++;
        }
        
        // Petite pause pour ne pas surcharger l'API
        await new Promise(resolve => setTimeout(resolve, 300));
        
      } catch (error) {
        console.log(`   ❌ Erreur : ${error.message}\n`);
        errorCount++;
        errors.push({ prenom, email, reason: error.message });
      }
    }

    // 3. Résumé
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('📊 RÉSUMÉ DE LA CRÉATION\n');
    console.log(`   ✅ Créés avec succès : ${successCount}`);
    console.log(`   ⚠️  Erreurs/Existants : ${errorCount}`);
    console.log(`   📊 Total : ${LIVREURS.length}\n`);

    if (errors.length > 0) {
      console.log('❌ Détails des erreurs :\n');
      errors.forEach(({ prenom, email, reason }) => {
        console.log(`   - ${prenom} (${email}): ${reason}`);
      });
      console.log('\n');
    }

    // 4. Informations de connexion
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🔑 INFORMATIONS DE CONNEXION POUR LES LIVREURS\n');
    console.log('   Email : [prenom]@gmail.com');
    console.log(`   Mot de passe : ${DEFAULT_PASSWORD}\n`);
    console.log('   Exemples :');
    console.log('   - djakis@gmail.com');
    console.log('   - souley@gmail.com');
    console.log('   - mobio@gmail.com\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // 5. Liste complète des livreurs créés
    if (successCount > 0) {
      console.log('📋 LISTE DES LIVREURS CRÉÉS :\n');
      LIVREURS.forEach((prenom, index) => {
        console.log(`   ${index + 1}. ${prenom.padEnd(15)} → ${prenom}@gmail.com`);
      });
      console.log('\n');
    }

    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 CRÉATION TERMINÉE !\n');
    console.log('   Les livreurs peuvent maintenant se connecter sur :');
    console.log('   👉 https://afgestion.net\n');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR FATALE :', error.message, '\n');
    throw error;
  }
}

// Exécuter
creerLivreursBatch()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error.message);
    process.exit(1);
  });
















