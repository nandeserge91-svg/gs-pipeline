/**
 * SCRIPT - CRÉER LE PRODUIT COLLANTGAINE
 * 
 * Ce script crée le produit COLLANTGAINE dans la base de données
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function creerProduitCollantgaine() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   📦 CRÉATION DU PRODUIT COLLANTGAINE                        ║');
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
    console.log('🔍 Vérification si COLLANTGAINE existe...\n');
    
    const checkResponse = await fetch(`${API_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const { products } = await checkResponse.json();
    const collantgaineExiste = products.find(p => p.code === 'COLLANTGAINE');

    if (collantgaineExiste) {
      console.log('⚠️  Le produit COLLANTGAINE existe déjà !\n');
      console.log('   ID:', collantgaineExiste.id);
      console.log('   Nom:', collantgaineExiste.nom);
      console.log('   Prix:', collantgaineExiste.prixUnitaire, 'FCFA');
      console.log('   Stock:', collantgaineExiste.stockActuel);
      console.log('\n   Utilisez la modification de produit si besoin.\n');
      return;
    }

    // 3. Créer le produit
    console.log('📦 Création du produit COLLANTGAINE...\n');
    
    const createResponse = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 'COLLANTGAINE',
        nom: 'Taille-collantgaine',
        description: 'Collant gainant disponible en tailles S, M, L, XL, 2XL, 3XL',
        prixUnitaire: 9900,    // Prix : 9900 FCFA
        stockActuel: 100,      // Stock initial : 100 unités
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
    console.log(`      Prix: ${newProduct.prixUnitaire} FCFA`);
    console.log(`      Stock: ${newProduct.stockActuel}`);
    console.log(`      Actif: ${newProduct.actif ? 'Oui' : 'Non'}`);
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    console.log('🎉 Maintenant, testez avec Google Apps Script :\n');
    console.log('   1. Exécutez testCollantGaine() dans Apps Script');
    console.log('   2. Le montant sera calculé automatiquement : 9900 FCFA');
    console.log('   3. Le stock variera quand la commande sera livrée !');
    console.log('\n═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message, '\n');
    throw error;
  }
}

// Exécuter
creerProduitCollantgaine()
  .then(() => {
    console.log('✅ Script terminé avec succès.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur fatale :', error.message);
    process.exit(1);
  });

