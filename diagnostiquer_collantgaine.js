/**
 * SCRIPT DE DIAGNOSTIC COMPLET - COLLANTGAINE
 * 
 * Ce script va tout vérifier pour comprendre pourquoi le montant est à 0
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function diagnostiquerCollantgaine() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🔍 DIAGNOSTIC COMPLET - COLLANTGAINE                       ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  try {
    // 1. Connexion admin
    console.log('📍 ÉTAPE 1 : Connexion admin');
    console.log('─────────────────────────────────────────────────────────────');
    
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
      const error = await loginResponse.text();
      console.log('❌ Échec de connexion');
      console.log('   Status:', loginResponse.status);
      console.log('   Erreur:', error);
      throw new Error('Connexion impossible');
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connexion réussie\n');

    // 2. Vérifier tous les produits
    console.log('📍 ÉTAPE 2 : Liste de TOUS les produits');
    console.log('─────────────────────────────────────────────────────────────');
    
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
    
    console.log(`📦 Nombre total de produits : ${products.length}\n`);
    
    // Afficher tous les produits
    console.log('Liste complète des produits :');
    console.log('─────────────────────────────────────────────────────────────');
    products.forEach((p, index) => {
      console.log(`${index + 1}. Code: "${p.code}" | Nom: "${p.nom}" | Prix: ${p.prixUnitaire} FCFA | Stock: ${p.stockActuel} | Actif: ${p.actif}`);
    });
    console.log('');

    // 3. Chercher COLLANTGAINE (avec différentes variantes)
    console.log('📍 ÉTAPE 3 : Recherche du produit COLLANTGAINE');
    console.log('─────────────────────────────────────────────────────────────');
    
    const variantes = ['COLLANTGAINE', 'collantgaine', 'Collantgaine', 'Taille-collantgaine', 'TAILLE-COLLANTGAINE'];
    let produitTrouve = null;
    
    for (const variante of variantes) {
      const found = products.find(p => 
        p.code.toLowerCase() === variante.toLowerCase() || 
        p.nom.toLowerCase() === variante.toLowerCase()
      );
      if (found) {
        produitTrouve = found;
        console.log(`✅ Produit trouvé avec la recherche : "${variante}"`);
        break;
      }
    }

    if (!produitTrouve) {
      console.log('❌ LE PRODUIT COLLANTGAINE N\'EXISTE PAS !');
      console.log('\n🔧 ACTION REQUISE : Créer le produit\n');
      await creerCollantgaine(token);
      return;
    }

    // 4. Analyser le produit trouvé
    console.log('\n📊 DÉTAILS DU PRODUIT TROUVÉ :');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('   ID              :', produitTrouve.id);
    console.log('   Code            :', produitTrouve.code);
    console.log('   Nom             :', produitTrouve.nom);
    console.log('   Description     :', produitTrouve.description || 'N/A');
    console.log('   Prix unitaire   :', produitTrouve.prixUnitaire, 'FCFA');
    console.log('   Stock actuel    :', produitTrouve.stockActuel);
    console.log('   Stock minimum   :', produitTrouve.stockMinimum);
    console.log('   Actif           :', produitTrouve.actif ? 'Oui' : 'Non');
    console.log('═════════════════════════════════════════════════════════════\n');

    // 5. Diagnostic du problème
    console.log('📍 ÉTAPE 4 : Diagnostic du problème');
    console.log('─────────────────────────────────────────────────────────────');

    const problemes = [];

    if (produitTrouve.prixUnitaire === 0 || !produitTrouve.prixUnitaire) {
      problemes.push({
        type: 'CRITIQUE',
        description: 'Le prix unitaire est 0 ou null',
        solution: 'Mettre à jour le prix à 9900 FCFA'
      });
    }

    if (!produitTrouve.actif) {
      problemes.push({
        type: 'BLOQUANT',
        description: 'Le produit est désactivé (actif = false)',
        solution: 'Activer le produit'
      });
    }

    if (produitTrouve.code !== 'COLLANTGAINE') {
      problemes.push({
        type: 'AVERTISSEMENT',
        description: `Le code est "${produitTrouve.code}" au lieu de "COLLANTGAINE"`,
        solution: 'Vérifier le mapping dans le Google Apps Script'
      });
    }

    if (problemes.length === 0) {
      console.log('✅ Aucun problème détecté avec le produit !');
      console.log('\n💡 Si le montant est toujours à 0, le problème vient peut-être de :');
      console.log('   1. Le mapping dans le Google Apps Script');
      console.log('   2. Le code de l\'API qui calcule le montant');
      console.log('   3. Les anciennes commandes (qui gardent leur montant de 0)');
      console.log('\n🧪 TEST : Créez une NOUVELLE commande pour vérifier\n');
    } else {
      console.log(`⚠️  ${problemes.length} problème(s) détecté(s) :\n`);
      
      problemes.forEach((pb, index) => {
        console.log(`${index + 1}. [${pb.type}] ${pb.description}`);
        console.log(`   → Solution : ${pb.solution}\n`);
      });

      // 6. Proposer la correction
      console.log('📍 ÉTAPE 5 : Correction automatique');
      console.log('─────────────────────────────────────────────────────────────');
      
      if (problemes.some(p => p.type === 'CRITIQUE' || p.type === 'BLOQUANT')) {
        console.log('🔧 Application des corrections...\n');
        await corrigerProduit(token, produitTrouve.id, problemes);
      }
    }

    // 7. Test de création de commande
    console.log('\n📍 ÉTAPE 6 : Test de création de commande');
    console.log('─────────────────────────────────────────────────────────────');
    await testerCreationCommande(token);

  } catch (error) {
    console.error('\n❌ ERREUR FATALE :', error.message);
    console.error('\nStack:', error.stack);
    throw error;
  }
}

/**
 * Créer le produit COLLANTGAINE
 */
async function creerCollantgaine(token) {
  console.log('🔧 Création du produit COLLANTGAINE...\n');

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
      prixUnitaire: 9900,
      stockActuel: 100,
      stockMinimum: 10,
      actif: true
    })
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    console.log('❌ Échec de création');
    console.log('   Status:', createResponse.status);
    console.log('   Erreur:', error);
    throw new Error('Création impossible');
  }

  const newProduct = await createResponse.json();
  
  console.log('✅ PRODUIT CRÉÉ AVEC SUCCÈS !');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('   ID              :', newProduct.id);
  console.log('   Code            :', newProduct.code);
  console.log('   Nom             :', newProduct.nom);
  console.log('   Prix            :', newProduct.prixUnitaire, 'FCFA');
  console.log('   Stock           :', newProduct.stockActuel);
  console.log('═════════════════════════════════════════════════════════════\n');
}

/**
 * Corriger le produit
 */
async function corrigerProduit(token, productId, problemes) {
  const updates = {};

  // Déterminer quoi mettre à jour
  if (problemes.some(p => p.description.includes('prix'))) {
    updates.prixUnitaire = 9900;
  }
  if (problemes.some(p => p.description.includes('désactivé'))) {
    updates.actif = true;
  }

  console.log('Mise à jour du produit avec:', JSON.stringify(updates, null, 2), '\n');

  const updateResponse = await fetch(`${API_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });

  if (!updateResponse.ok) {
    const error = await updateResponse.text();
    console.log('❌ Échec de mise à jour');
    console.log('   Status:', updateResponse.status);
    console.log('   Erreur:', error);
    throw new Error('Mise à jour impossible');
  }

  const updatedProduct = await updateResponse.json();
  
  console.log('✅ PRODUIT CORRIGÉ AVEC SUCCÈS !');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('   ID              :', updatedProduct.id);
  console.log('   Prix            :', updatedProduct.prixUnitaire, 'FCFA');
  console.log('   Actif           :', updatedProduct.actif ? 'Oui' : 'Non');
  console.log('═════════════════════════════════════════════════════════════\n');
}

/**
 * Tester la création d'une commande
 */
async function testerCreationCommande(token) {
  console.log('🧪 Test de création d\'une commande de test...\n');

  const testCommande = {
    nom: 'TEST DIAGNOSTIC',
    telephone: '22507999999999',
    ville: 'TEST',
    offre: 'Taille-collantgaine',
    tag: 'COLLANTGAINE',
    quantite: 1,
    notes: 'Test: Taille S'
  };

  console.log('Envoi de la commande test:', JSON.stringify(testCommande, null, 2), '\n');

  const createOrderResponse = await fetch(`${API_URL}/api/webhook/google-sheet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testCommande)
  });

  const responseText = await createOrderResponse.text();
  
  console.log('📡 Réponse du serveur:');
  console.log('   Status:', createOrderResponse.status);
  console.log('   Réponse:', responseText, '\n');

  if (createOrderResponse.ok) {
    try {
      const orderData = JSON.parse(responseText);
      console.log('✅ Commande créée avec succès !');
      console.log('═════════════════════════════════════════════════════════════');
      console.log('   ID commande     :', orderData.order_id);
      console.log('   Référence       :', orderData.order_reference);
      console.log('   Montant calculé :', orderData.montantTotal || 'N/A', 'FCFA');
      console.log('═════════════════════════════════════════════════════════════\n');
      
      // Vérifier le montant
      if (orderData.montantTotal === 0) {
        console.log('⚠️  LE MONTANT EST TOUJOURS À 0 !');
        console.log('\n💡 Le problème vient du calcul côté API.');
        console.log('   Vérifiez le fichier : routes/webhook.routes.js');
        console.log('   Ligne à vérifier : calcul du montantTotal\n');
      } else {
        console.log('🎉 LE MONTANT EST CORRECT !');
        console.log('   Les nouvelles commandes auront le bon montant.\n');
      }
    } catch (e) {
      console.log('⚠️  Impossible de parser la réponse comme JSON');
    }
  } else {
    console.log('❌ Échec de création de commande test');
  }
}

// Exécuter
diagnostiquerCollantgaine()
  .then(() => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ DIAGNOSTIC TERMINÉ                                      ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n╔══════════════════════════════════════════════════════════════╗');
    console.error('║   ❌ DIAGNOSTIC ÉCHOUÉ                                       ║');
    console.error('╚══════════════════════════════════════════════════════════════╝\n');
    console.error('Erreur:', error.message, '\n');
    process.exit(1);
  });










































