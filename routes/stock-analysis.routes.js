import express from 'express';
import prisma from '../config/prisma.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

/**
 * GET /api/stock-analysis/local-reserve
 * Analyse du stock LOCAL en cours de livraison
 * Affiche les produits physiquement avec les livreurs
 */
router.get('/local-reserve', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    console.log('📊 Récupération analyse stock LOCAL réservé...');

    const statuts = ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'];
    if (req.query.includeHistory === 'true') statuts.push('LIVREE');

    // Récupérer toutes les commandes en cours de livraison (LOCAL uniquement)
    const commandesEnCours = await prisma.order.findMany({
      where: {
        status: {
          in: statuts
        },
        deliveryType: 'LOCAL',
        // Colis remis au livreur (TourneeStock n'existe qu'après la remise) et tournée non terminée
        OR: [
          { deliveryListId: null },
          {
            deliveryList: {
              tourneeStock: { colisRetourConfirme: false }
            }
          }
        ]
      },
      include: {
        product: true,
        deliverer: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true
          }
        },
        deliveryList: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`✅ ${commandesEnCours.length} commandes en cours de livraison`);

    // Statistiques globales
    const totalCommandes = commandesEnCours.length;
    const totalQuantite = commandesEnCours.reduce((sum, cmd) => sum + (cmd.quantite || 1), 0);
    const produitsUniques = new Set(commandesEnCours.map(cmd => cmd.productId).filter(Boolean));
    const livreursUniques = new Set(commandesEnCours.map(cmd => cmd.delivererId).filter(Boolean));

    const summary = {
      totalCommandes,
      totalQuantite,
      totalProduitsConcernes: produitsUniques.size,
      totalLivreurs: livreursUniques.size
    };

    // Analyse par produit
    const groupeParProduit = {};
    commandesEnCours.forEach(cmd => {
      if (!cmd.productId) return;

      if (!groupeParProduit[cmd.productId]) {
        groupeParProduit[cmd.productId] = {
          product: cmd.product,
          quantiteReelle: 0,
          nombreLivreurs: new Set(),
          commandes: []
        };
      }

      groupeParProduit[cmd.productId].quantiteReelle += (cmd.quantite || 1);
      if (cmd.delivererId) {
        groupeParProduit[cmd.productId].nombreLivreurs.add(cmd.delivererId);
      }
      groupeParProduit[cmd.productId].commandes.push({
        id: cmd.id,
        orderReference: cmd.orderReference,
        clientNom: cmd.clientNom,
        clientTelephone: cmd.clientTelephone,
        clientVille: cmd.clientVille,
        quantite: cmd.quantite || 1,
        status: cmd.status,
        noteLivreur: cmd.noteLivreur,
        deliveryDate: cmd.deliveryDate,
        createdAt: cmd.createdAt,
        deliverer: cmd.deliverer
      });
    });

    const parProduit = Object.values(groupeParProduit).map(item => ({
      product: item.product,
      quantiteReelle: item.quantiteReelle,
      nombreLivreurs: item.nombreLivreurs.size,
      commandes: item.commandes
    }));

    // Analyse par livreur
    const groupeParLivreur = {};
    commandesEnCours.forEach(cmd => {
      if (!cmd.delivererId) return;

      if (!groupeParLivreur[cmd.delivererId]) {
        groupeParLivreur[cmd.delivererId] = {
          deliverer: cmd.deliverer,
          totalQuantite: 0,
          produits: {},
          commandes: []
        };
      }

      groupeParLivreur[cmd.delivererId].totalQuantite += (cmd.quantite || 1);

      // Grouper par produit pour ce livreur
      const productId = cmd.productId || 'inconnu';
      if (!groupeParLivreur[cmd.delivererId].produits[productId]) {
        groupeParLivreur[cmd.delivererId].produits[productId] = {
          nom: cmd.produitNom || cmd.product?.nom || 'Produit inconnu',
          quantite: 0
        };
      }
      groupeParLivreur[cmd.delivererId].produits[productId].quantite += (cmd.quantite || 1);

      groupeParLivreur[cmd.delivererId].commandes.push({
        id: cmd.id,
        orderReference: cmd.orderReference,
        clientNom: cmd.clientNom,
        produitNom: cmd.produitNom || cmd.product?.nom,
        quantite: cmd.quantite || 1,
        status: cmd.status,
        noteLivreur: cmd.noteLivreur,
        deliveryDate: cmd.deliveryDate,
        createdAt: cmd.createdAt
      });
    });

    const parLivreur = Object.values(groupeParLivreur);

    console.log(`📊 Analyse terminée :
      - ${summary.totalCommandes} commandes
      - ${summary.totalQuantite} produits
      - ${summary.totalProduitsConcernes} types de produits
      - ${summary.totalLivreurs} livreurs actifs
    `);

    res.json({
      summary,
      parProduit,
      parLivreur
    });

  } catch (error) {
    console.error('❌ Erreur analyse stock LOCAL :', error);
    res.status(500).json({ 
      error: 'Erreur lors de l\'analyse du stock',
      details: error.message
    });
  }
});

export default router;

