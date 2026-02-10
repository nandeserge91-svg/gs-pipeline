/**
 * SCRIPT - VÉRIFIER ET CORRIGER LE PRODUIT PHOTOGRAY
 * 
 * Ce script vérifie si le produit PHOTOGRAY existe et a le bon prix
 */

const API_URL = 'https://gs-pipeline-production.up.railway.app';
const ADMIN_EMAIL = 'admin@gs-pipeline.com';
const ADMIN_PASSWORD = 'admin123';

async function verifierPhotoGray() {
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🔍 VÉRIFICATION DU PRODUIT PHOTOGRAY                       ║');
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

    // 2. Récupérer tous les produits
    console.log('🔍 Recherche du produit PHOTOGRAY...');
    
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
    const photogray = products.find(p => p.code === 'PHOTOGRAY');

    console.log(`📦 Nombre total de produits : ${products.length}\n`);

    // 3. Analyser
    if (!photogray) {
      console.log('❌ PRODUIT PHOTOGRAY N\'EXISTE PAS !\n');
      console.log('🔧 SOLUTION : Créer le produit...\n');
      await creerPhotoGray(token);
      
    } else {
      console.log('✅ Le produit PHOTOGRAY existe !\n');
      console.log('📊 DÉTAILS DU PRODUIT :');
      console.log('═════════════════════════════════════════════════════════════');
      console.log('   ID              :', photogray.id);
      console.log('   Code            :', photogray.code);
      console.log('   Nom             :', photogray.nom);
      console.log('   Description     :', photogray.description || 'N/A');
      console.log('   Prix unitaire   :', photogray.prixUnitaire, 'FCFA');
      console.log('   Stock actuel    :', photogray.stockActuel);
      console.log('   Actif           :', photogray.actif ? 'Oui' : 'Non');
      console.log('═════════════════════════════════════════════════════════════\n');

      // Vérifier le prix
      if (photogray.prixUnitaire !== 9900) {
        console.log('⚠️  Le prix n\'est PAS 9900 FCFA !\n');
        console.log('🔧 Mise à jour du prix...\n');
        await mettreAJourPrix(token, photogray.id);
      } else {
        console.log('✅ Le prix est correct (9900 FCFA) !\n');
      }

      // Vérifier le nom
      if (photogray.nom !== 'LUNETTES PHOTOGRAY') {
        console.log('⚠️  Le nom n\'est PAS "LUNETTES PHOTOGRAY" !\n');
        console.log(`   Nom actuel: "${photogray.nom}"\n`);
        console.log('🔧 Mise à jour du nom...\n');
        await mettreAJourNom(token, photogray.id);
      } else {
        console.log('✅ Le nom est correct (LUNETTES PHOTOGRAY) !\n');
      }
    }

    // 4. Test de commande
    console.log('🧪 Test de création de commande...\n');
    await testerCommande();

  } catch (error) {
    console.error('\n❌ ERREUR :', error.message);
    throw error;
  }
}

/**
 * Créer le produit PHOTOGRAY
 */
async function creerPhotoGray(token) {
  const createResponse = await fetch(`${API_URL}/api/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: 'PHOTOGRAY',
      nom: 'LUNETTES PHOTOGRAY',
      description: 'Verres PhotoGray - Variantes: Z, Y, X, M1, M2, M3',
      prixUnitaire: 9900,
      stockActuel: 100,
      stockMinimum: 10,
      actif: true
    })
  });

  if (!createResponse.ok) {
    const error = await createResponse.json();
    throw new Error(`Échec de création : ${error.error || 'Erreur inconnue'}`);
  }

  const newProduct = await createResponse.json();
  
  console.log('✅ PRODUIT CRÉÉ AVEC SUCCÈS !');
  console.log('═════════════════════════════════════════════════════════════');
  console.log('   ID              :', newProduct.id);
  console.log('   Code            :', newProduct.code);
  console.log('   Nom             :', newProduct.nom);
  console.log('   Prix            :', newProduct.prixUnitaire, 'FCFA');
  console.log('═════════════════════════════════════════════════════════════\n');
}

/**
 * Mettre à jour le prix
 */
async function mettreAJourPrix(token, productId) {
  const updateResponse = await fetch(`${API_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prixUnitaire: 9900
    })
  });

  if (!updateResponse.ok) {
    throw new Error('Échec de mise à jour du prix');
  }

  const updatedProduct = await updateResponse.json();
  console.log('✅ Prix mis à jour : 9900 FCFA\n');
}

/**
 * Mettre à jour le nom
 */
async function mettreAJourNom(token, productId) {
  const updateResponse = await fetch(`${API_URL}/api/products/${productId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      nom: 'LUNETTES PHOTOGRAY'
    })
  });

  if (!updateResponse.ok) {
    throw new Error('Échec de mise à jour du nom');
  }

  const updatedProduct = await updateResponse.json();
  console.log('✅ Nom mis à jour : LUNETTES PHOTOGRAY\n');
}

/**
 * Tester la création d'une commande
 */
async function testerCommande() {
  const testCommande = {
    nom: 'TEST PHOTOGRAY',
    telephone: '22507777777777',
    ville: 'Abidjan',
    offre: 'LUNETTES PHOTOGRAY',
    tag: 'PHOTOGRAY',
    quantite: 1,
    notes: 'Variante: Z'
  };

  console.log('Envoi de la commande test:', JSON.stringify(testCommande, null, 2), '\n');

  const createOrderResponse = await fetch(`${API_URL}/api/webhook/google-sheet`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(testCommande)
  });

  if (!createOrderResponse.ok) {
    console.log('❌ Échec du test de commande');
    console.log('   Status:', createOrderResponse.status);
  } else {
    const orderData = await createOrderResponse.json();
    console.log('✅ Commande test créée !');
    console.log('   ID:', orderData.order_id);
    console.log('   Référence:', orderData.order_reference);
  }
}

// Exécuter
verifierPhotoGray()
  .then(() => {
    console.log('\n╔══════════════════════════════════════════════════════════════╗');
    console.log('║   ✅ VÉRIFICATION TERMINÉE                                   ║');
    console.log('╚══════════════════════════════════════════════════════════════╝\n');
    console.log('🎯 RÉSUMÉ :\n');
    console.log('   • Code produit : PHOTOGRAY');
    console.log('   • Nom produit : LUNETTES PHOTOGRAY');
    console.log('   • Prix : 9900 FCFA');
    console.log('   • Format tag : "PhotoGray Z" (ou Y, X, etc.)');
    console.log('   • Affichage : "Variante: Z" dans la colonne Note\n');
    console.log('🧪 TESTER :\n');
    console.log('   Exécutez testPhotoGray() dans Google Apps Script\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur :', error.message, '\n');
    process.exit(1);
  });










































