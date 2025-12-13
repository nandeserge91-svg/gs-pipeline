/**
 * ROUTE API - SUPPRESSION DES COMMANDES "À APPELER"
 * 
 * DELETE /api/orders/delete-a-appeler
 * 
 * ⚠️ ATTENTION : Supprime TOUTES les commandes avec statut NOUVELLE ou A_APPELER
 * Réservé à l'ADMIN uniquement
 */

import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * DELETE /api/orders/delete-a-appeler
 * Supprime toutes les commandes en statut NOUVELLE ou A_APPELER
 * Accessible uniquement par ADMIN
 */
router.delete('/delete-a-appeler', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    console.log('🗑️  Demande de suppression des commandes "À appeler"...');

    // 1. Compter les commandes à supprimer
    const count = await prisma.order.count({
      where: {
        status: {
          in: ['NOUVELLE', 'A_APPELER']
        }
      }
    });

    console.log(`📊 Nombre de commandes à supprimer : ${count}`);

    if (count === 0) {
      return res.json({
        success: true,
        message: 'Aucune commande à supprimer.',
        count: 0
      });
    }

    // 2. Récupérer les références des commandes (pour le log)
    const commandes = await prisma.order.findMany({
      where: {
        status: {
          in: ['NOUVELLE', 'A_APPELER']
        }
      },
      select: {
        id: true,
        reference: true,
        clientNom: true,
        produitNom: true,
        status: true
      }
    });

    console.log('📋 Commandes à supprimer :');
    commandes.forEach(cmd => {
      console.log(`   - ${cmd.reference}: ${cmd.clientNom} (${cmd.produitNom}) - ${cmd.status}`);
    });

    // 3. Supprimer les commandes
    const result = await prisma.order.deleteMany({
      where: {
        status: {
          in: ['NOUVELLE', 'A_APPELER']
        }
      }
    });

    console.log(`✅ ${result.count} commande(s) supprimée(s)`);

    res.json({
      success: true,
      message: `${result.count} commande(s) supprimée(s) avec succès.`,
      count: result.count,
      deletedReferences: commandes.map(c => c.reference)
    });

  } catch (error) {
    console.error('❌ Erreur lors de la suppression des commandes :', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression des commandes.',
      details: error.message
    });
  }
});

export default router;

