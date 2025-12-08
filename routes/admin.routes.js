import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/admin/fix-express-stock - Corriger le stock EXPRESS pour les commandes déjà retirées
router.post('/fix-express-stock', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🔧 Correction du stock EXPRESS pour les commandes déjà retirées...');

    // Trouver toutes les commandes EXPRESS_LIVRE avec un produit
    const commandesRetires = await prisma.order.findMany({
      where: {
        status: 'EXPRESS_LIVRE',
        deliveryType: 'EXPRESS',
        productId: { not: null }
      },
      include: {
        product: true
      }
    });

    console.log(`📦 Trouvé ${commandesRetires.length} commande(s) EXPRESS déjà retirée(s)`);

    const corrections = [];

    // Pour chaque commande, diminuer le stock EXPRESS si nécessaire
    for (const order of commandesRetires) {
      if (order.product && order.product.stockExpress > 0) {
        const stockAvant = order.product.stockExpress;
        const stockApres = Math.max(0, stockAvant - order.quantite);

        await prisma.$transaction(async (tx) => {
          // Mettre à jour le stock EXPRESS
          await tx.product.update({
            where: { id: order.productId },
            data: { stockExpress: stockApres }
          });

          // Créer le mouvement de stock pour la traçabilité
          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              quantite: order.quantite,
              type: 'SORTIE',
              stockAvant: stockAvant,
              stockApres: stockApres,
              effectuePar: req.user.id,
              motif: `[CORRECTION AUTO] Retrait EXPRESS déjà effectué - Commande ${order.orderReference}`,
              orderId: order.id
            }
          });
        });

        corrections.push({
          produit: order.product.nom,
          commande: order.orderReference,
          stockAvant,
          stockApres
        });

        console.log(`✅ ${order.product.nom}: Stock EXPRESS ${stockAvant} → ${stockApres} (Commande ${order.orderReference})`);
      }
    }

    res.json({
      message: 'Correction du stock EXPRESS terminée.',
      corrections,
      total: corrections.length
    });
  } catch (error) {
    console.error('❌ Erreur correction stock EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la correction du stock EXPRESS.' });
  }
});

export default router;

