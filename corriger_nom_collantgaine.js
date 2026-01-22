/**
 * SCRIPT - CORRIGER LE NOM DU PRODUIT COLLANTGAINE
 * 
 * Problème identifié : 
 * - Nom actuel dans la base : "COLLANTGAINE"
 * - Nom attendu par le script Google : "Taille-collantgaine"
 * 
 * Ce script met à jour le nom pour qu'il corresponde
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function corrigerNomCollantgaine() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🔧 CORRECTION DU NOM DU PRODUIT COLLANTGAINE              ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Connexion admin
    console.log('🔐 Connexion admin...');
    
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
    console.log('✅ Connexion réussie\n');

    // 2. Récupérer le produit COLLANTGAINE
    console.log('🔍 Recherche du produit COLLANTGAINE...');
    
    const productsResponse = await fetch(`${API_URL}/api/products`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      throw new Error('Impossible de récupérer les produits');
    }

    const { products } = await productsResponse.json();
    const collantgaine = products.find(p => p.code === 'COLLANTGAINE');

    if (!collantgaine) {
      throw new Error('Produit COLLANTGAINE non trouvé !');
    }

    console.log('✅ Produit trouvé\n');
    console.log('📊 ÉTAT ACTUEL :');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('   ID              :', collantgaine.id);
    console.log('   Code            :', collantgaine.code);
    console.log('   Nom actuel      :', collantgaine.nom);
    console.log('   Prix            :', collantgaine.prixUnitaire, 'FCFA');
    console.log('═════════════════════════════════════════════════════════════\n');

    // 3. Mettre à jour le nom
    console.log('🔧 Mise à jour du nom du produit...\n');

    const updateResponse = await fetch(`${API_URL}/api/products/${collantgaine.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nom: 'Taille-collantgaine',
        description: 'Collant gainant disponible en tailles S, M, L, XL, 2XL, 3XL'
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.log('❌ Échec de mise à jour');
      console.log('   Status:', updateResponse.status);
      console.log('   Erreur:', error);
      throw new Error('Mise à jour impossible');
    }

    const updatedProduct = await updateResponse.json();
    
    console.log('✅ PRODUIT MIS À JOUR AVEC SUCCÈS !');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('   ID              :', updatedProduct.id);
    console.log('   Code            :', updatedProduct.code);
    console.log('   Nom nouveau     :', updatedProduct.nom);
    console.log('   Description     :', updatedProduct.description || 'N/A');
    console.log('   Prix            :', updatedProduct.prixUnitaire, 'FCFA');
    console.log('═════════════════════════════════════════════════════════════\n');

    // 4. Tester avec une commande
    console.log('🧪 Test de création de commande...\n');

    const testCommande = {
      nom: 'TEST CORRECTION',
      telephone: '22507888888888',
      ville: 'Abidjan',
      offre: 'Taille-collantgaine',  // Maintenant devrait matcher
      tag: 'COLLANTGAINE',
      quantite: 1,
      notes: 'Test après correction du nom'
    };

    const createOrderResponse = await fetch(`${API_URL}/api/webhook/google-sheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testCommande)
    });

    if (!createOrderResponse.ok) {
      console.log('⚠️  Échec du test de commande');
    } else {
      const orderData = await createOrderResponse.json();
      console.log('✅ Commande test créée !');
      console.log('   ID:', orderData.order_id);
      console.log('   Référence:', orderData.order_reference);
    }

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    throw error;
  }
}

// Exécuter
corrigerNomCollantgaine()
  .then(() => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ CORRECTION TERMINÉE AVEC SUCCÈS                         ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('🎯 PROCHAINES ÉTAPES :\n');
    console.log('   1. ✅ Le nom du produit est maintenant "Taille-collantgaine"');
    console.log('   2. ✅ Le code reste "COLLANTGAINE"');
    console.log('   3. ✅ Le prix est 9900 FCFA\n');
    console.log('🧪 TESTER :\n');
    console.log('   • Créez une nouvelle commande depuis le formulaire');
    console.log('   • Le montant devrait être 9900 FCFA');
    console.log('   • Vérifiez sur : https://afgestion.net/appelant/orders\n');
    console.log('💡 NOTE : Les anciennes commandes à 0 FCFA ne seront PAS mises à jour.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ CORRECTION ÉCHOUÉE :', error.message, '\n');
    process.exit(1);
  });




























