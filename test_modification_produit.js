// Script de test pour modifier un produit avec prix variantes
import fetch from 'node-fetch';

const API_URL = 'https://gs-pipeline-production.up.railway.app'; // Ou votre URL Railway
const TOKEN = 'VOTRE_TOKEN_ADMIN'; // À remplacer

async function testModificationProduit() {
  try {
    console.log('🧪 Test de modification de produit...\n');

    // 1. Récupérer la liste des produits
    console.log('1️⃣ Récupération des produits...');
    const listResponse = await fetch(`${API_URL}/api/products`, {
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    if (!listResponse.ok) {
      console.error('❌ Erreur récupération produits:', await listResponse.text());
      return;
    }

    const { products } = await listResponse.json();
    console.log(`✅ ${products.length} produits trouvés\n`);

    // Trouver BEE VENOM
    const beeVenom = products.find(p => p.code === 'BEE');
    if (!beeVenom) {
      console.error('❌ Produit BEE VENOM non trouvé');
      return;
    }

    console.log('2️⃣ Produit BEE VENOM trouvé:');
    console.log(`   ID: ${beeVenom.id}`);
    console.log(`   Nom: ${beeVenom.nom}`);
    console.log(`   Prix unitaire: ${beeVenom.prixUnitaire}`);
    console.log(`   Prix1: ${beeVenom.prix1}`);
    console.log(`   Prix2: ${beeVenom.prix2}`);
    console.log(`   Prix3: ${beeVenom.prix3}\n`);

    // 2. Modifier le produit
    console.log('3️⃣ Tentative de modification...');
    
    const updateData = {
      code: 'BEE',
      nom: 'BEE VENOM',
      description: 'ANTI DOULEUR',
      prixUnitaire: 9900,
      prix1: 9900,
      prix2: 16900,
      prix3: 23900,
      stockAlerte: 50
    };

    console.log('   Données envoyées:', JSON.stringify(updateData, null, 2));

    const updateResponse = await fetch(`${API_URL}/api/products/${beeVenom.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    console.log(`\n   Status: ${updateResponse.status}`);
    const responseText = await updateResponse.text();
    
    if (!updateResponse.ok) {
      console.error('❌ ERREUR lors de la modification:');
      console.error(responseText);
      
      try {
        const errorJson = JSON.parse(responseText);
        console.error('\n📋 Détails de l\'erreur:');
        console.error(JSON.stringify(errorJson, null, 2));
      } catch (e) {
        // Pas du JSON
      }
      return;
    }

    const result = JSON.parse(responseText);
    console.log('✅ Modification réussie!');
    console.log('\n📦 Produit modifié:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error);
  }
}

// Exécuter le test
testModificationProduit();
