/**
 * SCRIPT - VÉRIFIER ET CORRIGER LE PRODUIT COLLANTGAINE
 * 
 * Ce script :
 * 1. Vérifie si le produit COLLANTGAINE existe
 * 2. Vérifie son prix
 * 3. Crée ou met à jour le produit si nécessaire
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function verifierEtCorrigerCollantgaine() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🔍 VÉRIFICATION ET CORRECTION DU PRODUIT COLLANTGAINE     ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Connexion admin
    console.log('🔐 Connexion en tant qu\'admin...');
    
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

    // 2. Récupérer tous les produits
    console.log('🔍 Recherche du produit COLLANTGAINE...');
    
    const productsResponse = await fetch(`${API_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      throw new Error('Échec de récupération des produits');
    }

    const { products } = await productsResponse.json();
    const collantgaine = products.find(p => p.code === 'COLLANTGAINE');

    console.log(`📦 Nombre total de produits : ${products.length}\n`);

    // 3. Analyser la situation
    if (!collantgaine) {
      console.log('⚠️  PROBLÈME DÉTECTÉ : Le produit COLLANTGAINE n\'existe pas !\n');
      console.log('🔧 SOLUTION : Création du produit...\n');
      await creerCollantgaine(token);
      
    } else if (collantgaine.prixUnitaire === 0 || !collantgaine.prixUnitaire) {
      console.log('⚠️  PROBLÈME DÉTECTÉ : Le produit COLLANTGAINE a un prix de 0 !\n');
      console.log('   ID:', collantgaine.id);
      console.log('   Nom:', collantgaine.nom);
      console.log('   Prix actuel:', collantgaine.prixUnitaire, 'FCFA');
      console.log('   Stock:', collantgaine.stockActuel);
      console.log('   Actif:', collantgaine.actif ? 'Oui' : 'Non');
      console.log('\n🔧 SOLUTION : Mise à jour du prix...\n');
      await mettreAJourPrix(token, collantgaine.id);
      
    } else {
      console.log('✅ Le produit COLLANTGAINE existe avec un prix valide !\n');
      console.log('   ID:', collantgaine.id);
      console.log('   Nom:', collantgaine.nom);
      console.log('   Prix:', collantgaine.prixUnitaire, 'FCFA');
      console.log('   Stock:', collantgaine.stockActuel);
      console.log('   Actif:', collantgaine.actif ? 'Oui' : 'Non');
      console.log('\n✨ Tout est en ordre ! Les nouvelles commandes auront le bon montant.\n');
    }

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message, '\n');
    throw error;
  }
}

/**
 * Créer le produit COLLANTGAINE
 */
async function creerCollantgaine(token) {
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
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ PRODUIT CRÉÉ AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('   📋 Détails du produit :\n');
  console.log(`      ID: ${newProduct.id}`);
  console.log(`      Code: ${newProduct.code}`);
  console.log(`      Nom: ${newProduct.nom}`);
  console.log(`      Prix: ${newProduct.prixUnitaire} FCFA`);
  console.log(`      Stock: ${newProduct.stockActuel}`);
  console.log(`      Actif: ${newProduct.actif ? 'Oui' : 'Non'}`);
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

/**
 * Mettre à jour le prix du produit COLLANTGAINE
 */
async function mettreAJourPrix(token, productId) {
  const updateResponse = await fetch(`${API_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prixUnitaire: 9900    // Prix : 9900 FCFA
    })
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.json();
    throw new Error(`Échec de mise à jour : ${error.error || 'Erreur inconnue'}`);
  }

  const updatedProduct = await updateResponse.json();
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('✅ PRIX MIS À JOUR AVEC SUCCÈS !');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('   📋 Produit mis à jour :\n');
  console.log(`      ID: ${updatedProduct.id}`);
  console.log(`      Code: ${updatedProduct.code}`);
  console.log(`      Nom: ${updatedProduct.nom}`);
  console.log(`      Prix: ${updatedProduct.prixUnitaire} FCFA`);
  console.log(`      Stock: ${updatedProduct.stockActuel}`);
  console.log('\n═══════════════════════════════════════════════════════════════\n');
}

// Exécuter
verifierEtCorrigerCollantgaine()
  .then(() => {
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ CORRECTION TERMINÉE AVEC SUCCÈS                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('🎯 PROCHAINES ÉTAPES :\n');
    console.log('   1. Les NOUVELLES commandes auront le bon montant (9900 FCFA)');
    console.log('   2. Les anciennes commandes à 0 FCFA restent inchangées');
    console.log('   3. Si besoin, corrigez manuellement les anciennes commandes\n');
    console.log('🧪 TESTER MAINTENANT :\n');
    console.log('   • Créez une nouvelle commande depuis le formulaire');
    console.log('   • Vérifiez que le montant est bien 9900 FCFA\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale :', error.message);
    console.error('\n💡 SOLUTIONS :\n');
    console.error('   1. Vérifiez que l\'API est accessible : ' + API_URL);
    console.error('   2. Vérifiez vos identifiants admin');
    console.error('   3. Consultez les logs Railway pour plus de détails\n');
    process.exit(1);
  });




























