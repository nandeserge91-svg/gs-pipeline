import fetch from 'node-fetch';

// URL de votre API en production
const API_URL = 'https://your-railway-api-url.railway.app/api'; // ⚠️ À REMPLACER

// Identifiants admin pour se connecter
const ADMIN_EMAIL = 'admin@afgestion.net'; // ⚠️ À REMPLACER si nécessaire
const ADMIN_PASSWORD = 'votre-mot-de-passe'; // ⚠️ À REMPLACER

async function trouverAppelant() {
  try {
    console.log('🔐 Connexion à l\'API en production...\n');
    
    // 1. Se connecter pour obtenir le token
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
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
      console.error('❌ Erreur de connexion:', loginResponse.status);
      const error = await loginResponse.text();
      console.error(error);
      return;
    }

    const { token } = await loginResponse.json();
    console.log('✅ Connecté avec succès\n');

    // 2. Rechercher toutes les commandes avec Christelle
    console.log('🔍 Recherche de la commande...\n');
    
    const ordersResponse = await fetch(`${API_URL}/orders?search=Christelle&limit=100`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!ordersResponse.ok) {
      console.error('❌ Erreur lors de la récupération des commandes:', ordersResponse.status);
      return;
    }

    const { orders } = await ordersResponse.json();
    
    if (!orders || orders.length === 0) {
      console.log('❌ Aucune commande trouvée pour "Christelle"\n');
      return;
    }

    // 3. Filtrer pour trouver la commande BEE VENOM à San Pedro
    const commande = orders.find(order => 
      order.produitNom?.includes('BEE VENOM') &&
      order.clientVille?.toLowerCase().includes('san pedro') &&
      order.montant === 9900
    );

    if (!commande) {
      console.log('❌ Commande exacte non trouvée. Voici toutes les commandes Christelle:\n');
      orders.forEach((order, index) => {
        console.log(`${index + 1}. ${order.clientNom} - ${order.produitNom}`);
        console.log(`   Ville: ${order.clientVille}`);
        console.log(`   Montant: ${order.montant} F CFA`);
        console.log(`   Statut: ${order.status}`);
        if (order.caller) {
          console.log(`   👤 Appelant: ${order.caller.prenom} ${order.caller.nom}`);
        }
        console.log('');
      });
      return;
    }

    // 4. Récupérer les détails complets de la commande
    const detailResponse = await fetch(`${API_URL}/orders/${commande.id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!detailResponse.ok) {
      console.error('❌ Erreur lors de la récupération des détails:', detailResponse.status);
      return;
    }

    const { order } = await detailResponse.json();

    // 5. Afficher les résultats
    console.log('✅ COMMANDE TROUVÉE\n');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`📋 Référence: ${order.orderReference}`);
    console.log(`📝 ID: ${order.id}`);
    console.log(`👤 Client: ${order.clientNom}`);
    console.log(`📱 Téléphone: ${order.clientTelephone}`);
    console.log(`📍 Ville: ${order.clientVille}`);
    console.log(`📦 Produit: ${order.produitNom}`);
    console.log(`💰 Montant: ${order.montant.toLocaleString()} F CFA`);
    console.log(`📊 Statut: ${order.status}`);
    console.log(`📅 Date création: ${new Date(order.createdAt).toLocaleString('fr-FR')}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    // Afficher l'appelant
    if (order.caller) {
      console.log('👤 APPELANT QUI A TRAITÉ CETTE COMMANDE:\n');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`Nom complet: ${order.caller.prenom} ${order.caller.nom}`);
      console.log(`Email: ${order.caller.email || 'Non renseigné'}`);
      console.log(`Téléphone: ${order.caller.telephone || 'Non renseigné'}`);
      console.log(`ID: ${order.caller.id}`);
      console.log('═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('⚠️ AUCUN APPELANT ASSIGNÉ à cette commande\n');
    }

    // Afficher l'historique
    if (order.statusHistory && order.statusHistory.length > 0) {
      console.log('📜 HISTORIQUE DES STATUTS:\n');
      console.log('═══════════════════════════════════════════════════════════');
      order.statusHistory.forEach((history, index) => {
        console.log(`${index + 1}. ${history.status}`);
        console.log(`   Date: ${new Date(history.createdAt).toLocaleString('fr-FR')}`);
        if (history.note) {
          console.log(`   Note: ${history.note}`);
        }
        console.log('');
      });
      console.log('═══════════════════════════════════════════════════════════\n');

      // Trouver la validation
      const validation = order.statusHistory.find(h => h.status === 'VALIDEE');
      if (validation) {
        console.log('✅ VALIDATION DE LA COMMANDE:\n');
        console.log('═══════════════════════════════════════════════════════════');
        console.log(`📅 Date: ${new Date(validation.createdAt).toLocaleString('fr-FR')}`);
        if (validation.note) {
          console.log(`📝 Note: ${validation.note}`);
        }
        console.log('═══════════════════════════════════════════════════════════\n');
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

trouverAppelant();






