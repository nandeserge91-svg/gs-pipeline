/**
 * SCRIPT - CRÉER LE PRODUIT SADOER
 * 
 * Ce script crée le produit Sadoer dans la base de données
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function creerProduitSadoer() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   📦 CRÉATION DU PRODUIT SADOER                              ║');
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
      throw new Error('Échec de connexion admin');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion réussie !\n');

    // 2. Vérifier si le produit existe déjà
    console.log('🔍 Vérification si SADOER existe...\n');
    
    const checkResponse = await fetch(`${API_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const { products } = await checkResponse.json();
    const sadoerExiste = products.find(p => p.code === 'SADOER');

    if (sadoerExiste) {
      console.log('⚠️  Le produit SADOER existe déjà !\n');
      console.log('   ID:', sadoerExiste.id);
      console.log('   Nom:', sadoerExiste.nom);
      console.log('   Prix:', sadoerExiste.prixUnitaire, 'FCFA');
      console.log('   Stock:', sadoerExiste.stockActuel);
      console.log('\n   Utilisez la modification de produit si besoin.\n');
      return;
    }

    // 3. Créer le produit
    console.log('📦 Création du produit SADOER...\n');
    
    const createResponse = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'SADOER',
        nom: 'Sadoer',
        description: 'Produit Sadoer',
        prixUnitaire: 10000,     // Prix : 10000 FCFA (à ajuster selon vos besoins)
        stockActuel: 100,        // Stock initial : 100 unités
        stockMinimum: 10,
        actif: true
      })
    });

    if (!createResponse.ok) {
      const error = await createResponse.json();
      throw new Error(`Échec de création : ${error.error || 'Erreur inconnue'}`);
    }

    const newProduct = await createResponse.json();
    
    console.log('═══════════════════════════════════════════════════════════════\n');
    console.log('✅ PRODUIT CRÉÉ AVEC SUCCÈS !\n');
    console.log('   📋 Détails du produit :\n');
    console.log(`      ID: ${newProduct.id}`);
    console.log(`      Code: ${newProduct.code}`);
    console.log(`      Nom: ${newProduct.nom}`);
    console.log(`      Description: ${newProduct.description}`);
    console.log(`      Prix: ${newProduct.prixUnitaire} FCFA`);
    console.log(`      Stock: ${newProduct.stockActuel}`);
    console.log(`      Actif: ${newProduct.actif ? 'Oui' : 'Non'}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 Maintenant, testez avec Google Apps Script !\n');
    console.log('   Dans Google Sheet, utilisez le tag : "Sadoer" ou "1_Sadoer"');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message, '\n');
    throw error;
  }
}

// Exécuter
creerProduitSadoer()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error.message);
    process.exit(1);
  });










































