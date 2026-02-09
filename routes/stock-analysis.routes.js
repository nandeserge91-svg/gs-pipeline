import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/stock-analysis/local-reserve
 * Analyse du stock LOCAL en cours de livraison
 * Affiche les produits physiquement avec les livreurs
 */
router.get('/local-reserve', authenticate, authorize(['ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK']), async (req, res) => {
  try {
    console.log('📊 Récupération analyse stock LOCAL réservé...');

    // Récupérer toutes les commandes en cours de livraison (LOCAL uniquement)
    const commandesEnCours = await prisma.order.findMany({
      where: {
        status: {
          in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE']
        },
        deliveryType: 'LOCAL',
        // Exclure les commandes dont la tournée est terminée
        OR: [
          { deliveryListId: null },
          {
            deliveryList: {
              colisRetourConfirme: false
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

/**
 * POST /api/stock-analysis/recalculate-local-reserve
 * Recalcule et synchronise le stockLocalReserve avec la réalité des commandes
 * Admin uniquement
 */
router.post('/recalculate-local-reserve', authenticate, authorize(['ADMIN']), async (req, res) => {
  try {
    console.log('🔄 Synchronisation du stock LOCAL réservé...');

    // Récupérer tous les produits
    const produits = await prisma.product.findMany();

    const corrections = [];
    let totalCorrections = 0;
    let totalCommandesAnalysees = 0;

    for (const produit of produits) {
      // Calculer la quantité réelle en livraison
      const commandesEnCours = await prisma.order.findMany({
        where: {
          productId: produit.id,
          status: {
            in: ['ASSIGNEE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE']
          },
          deliveryType: 'LOCAL',
          OR: [
            { deliveryListId: null },
            {
              deliveryList: {
                colisRetourConfirme: false
              }
            }
          ]
        },
        include: {
          deliverer: {
            select: {
              nom: true,
              prenom: true
            }
          }
        }
      });

      totalCommandesAnalysees += commandesEnCours.length;

      const quantiteReelle = commandesEnCours.reduce((sum, cmd) => sum + (cmd.quantite || 1), 0);
      const stockActuel = produit.stockLocalReserve || 0;

      // Si écart détecté
      if (quantiteReelle !== stockActuel) {
        const ecart = quantiteReelle - stockActuel;

        console.log(`⚠️ Écart détecté pour ${produit.nom} :
          - Stock système : ${stockActuel}
          - Stock réel : ${quantiteReelle}
          - Écart : ${ecart}
        `);

        // Mise à jour du stock
        await prisma.product.update({
          where: { id: produit.id },
          data: { stockLocalReserve: quantiteReelle }
        });

        // Créer un mouvement de correction
        await prisma.stockMovement.create({
          data: {
            productId: produit.id,
            type: 'CORRECTION',
            quantite: Math.abs(ecart),
            stockAvant: stockActuel,
            stockApres: quantiteReelle,
            effectuePar: req.user.id,
            motif: `Synchronisation automatique - ${commandesEnCours.length} commandes en cours`
          }
        });

        corrections.push({
          productId: produit.id,
          productNom: produit.nom,
          ancien: stockActuel,
          nouveau: quantiteReelle,
          ecart,
          commandes: commandesEnCours.map(cmd => ({
            ref: cmd.orderReference,
            quantite: cmd.quantite || 1,
            livreur: cmd.deliverer ? `${cmd.deliverer.prenom} ${cmd.deliverer.nom}` : 'Non assigné'
          }))
        });

        totalCorrections++;
      }
    }

    console.log(`✅ Synchronisation terminée :
      - ${totalCorrections} corrections effectuées
      - ${totalCommandesAnalysees} commandes analysées
    `);

    res.json({
      message: `Synchronisation terminée : ${totalCorrections} correction(s) effectuée(s)`,
      totalCorrections,
      totalCommandesAnalysees,
      corrections
    });

  } catch (error) {
    console.error('❌ Erreur synchronisation stock :', error);
    res.status(500).json({ 
      error: 'Erreur lors de la synchronisation',
      details: error.message 
    });
  }
});

export default router;

