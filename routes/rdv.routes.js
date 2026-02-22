import express from 'express';

import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { sendSMS, smsTemplates } from '../services/sms.service.js';

const router = express.Router();
import prisma from '../config/prisma.js';

// ⏰ Basculer automatiquement les RDV échus vers "À appeler"
async function autoReturnExpiredRdvToCallList(userId) {
  const now = new Date();

  const expiredRdvOrders = await prisma.order.findMany({
    where: {
      rdvProgramme: true,
      rdvDate: { lte: now },
      status: { in: ['NOUVELLE', 'A_APPELER'] }
    },
    select: {
      id: true,
      status: true,
      noteAppelant: true,
      rdvNote: true,
      rdvDate: true
    }
  });

  if (expiredRdvOrders.length === 0) return 0;

  await prisma.$transaction(async (tx) => {
    for (const order of expiredRdvOrders) {
      const dateLabel = order.rdvDate ? new Date(order.rdvDate).toLocaleString('fr-FR') : 'N/A';
      const autoComment = `[RDV AUTO] Échéance atteinte (${dateLabel}) - renvoyée en haut de "À appeler"${order.rdvNote ? ` | Note RDV: ${order.rdvNote}` : ''}`;
      const mergedNote = order.noteAppelant
        ? `${order.noteAppelant}\n${autoComment}`
        : autoComment;

      await tx.order.update({
        where: { id: order.id },
        data: {
          status: 'A_APPELER',
          rdvProgramme: false,
          rdvDate: null,
          rdvNote: null,
          rdvRappele: false,
          rdvProgrammePar: null,
          renvoyeAAppelerAt: new Date(),
          noteAppelant: mergedNote
        }
      });

      await tx.statusHistory.create({
        data: {
          orderId: order.id,
          oldStatus: order.status,
          newStatus: 'A_APPELER',
          changedBy: userId,
          comment: '⏰ RDV arrivé à échéance: retour automatique dans "À appeler" (position prioritaire).'
        }
      });
    }
  });

  return expiredRdvOrders.length;
}

// POST /api/rdv/:id/programmer - Programmer un RDV pour une commande
router.post('/:id/programmer', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rdvDate, rdvNote } = req.body;

    if (!rdvDate) {
      return res.status(400).json({ error: 'Date du RDV requise.' });
    }

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est bien en statut NOUVELLE ou A_APPELER
    if (!['NOUVELLE', 'A_APPELER'].includes(order.status)) {
      return res.status(400).json({ error: 'Cette commande ne peut pas avoir de RDV programmé.' });
    }

    // Programmer le RDV
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        rdvProgramme: true,
        rdvDate: new Date(rdvDate),
        rdvNote: rdvNote || null,
        rdvProgrammePar: req.user.id,
        rdvRappele: false
      }
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: order.status, // Le statut ne change pas
        changedBy: req.user.id,
        comment: `RDV programmé pour le ${new Date(rdvDate).toLocaleString('fr-FR')}${rdvNote ? ' - ' + rdvNote : ''}`
      }
    });

    // 📱 Envoi SMS de confirmation RDV (non bloquant)
    const smsEnabled = process.env.SMS_ENABLED === 'true';
    const smsRdvScheduledEnabled = process.env.SMS_RDV_SCHEDULED !== 'false';
    
    if (smsEnabled && smsRdvScheduledEnabled) {
      try {
        const rdvDateObj = new Date(rdvDate);
        const rdvDateFormatted = rdvDateObj.toLocaleDateString('fr-FR', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
        const rdvHeureFormatted = rdvDateObj.toLocaleTimeString('fr-FR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        });

        const message = await smsTemplates.rdvScheduled(
          updatedOrder.clientNom,
          rdvDateFormatted,
          rdvHeureFormatted
        );
        
        await sendSMS(updatedOrder.clientTelephone, message, {
          orderId: updatedOrder.id,
          type: 'RDV_SCHEDULED',
          userId: req.user.id
        });
        
        console.log(`✅ SMS RDV programmé envoyé pour commande ${updatedOrder.orderReference}`);
      } catch (smsError) {
        console.error('⚠️ Erreur envoi SMS RDV (non bloquante):', smsError.message);
      }
    }

    res.json({
      order: updatedOrder,
      message: 'RDV programmé avec succès.'
    });
  } catch (error) {
    console.error('Erreur programmation RDV:', error);
    res.status(500).json({ error: 'Erreur lors de la programmation du RDV.' });
  }
});

// GET /api/rdv - Récupérer tous les RDV programmés
router.get('/', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { rappele, dateDebut, dateFin, search } = req.query;

    // Avant de lister les RDV, retirer automatiquement ceux qui sont arrivés à échéance.
    await autoReturnExpiredRdvToCallList(req.user.id);

    const where = {
      rdvProgramme: true
    };

    // Filtre par statut rappelé/non rappelé
    if (rappele !== undefined) {
      where.rdvRappele = rappele === 'true';
    }

    // Filtre par période de RDV
    if (dateDebut || dateFin) {
      where.rdvDate = {};
      if (dateDebut) {
        where.rdvDate.gte = new Date(`${dateDebut}T00:00:00.000Z`);
      }
      if (dateFin) {
        where.rdvDate.lte = new Date(`${dateFin}T23:59:59.999Z`);
      }
    }

    // Filtre par recherche (nom, téléphone)
    if (search) {
      where.OR = [
        { clientNom: { contains: search, mode: 'insensitive' } },
        { clientTelephone: { contains: search } },
        { orderReference: { contains: search, mode: 'insensitive' } }
      ];
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        caller: { select: { id: true, nom: true, prenom: true } },
        product: { select: { nom: true } }
      },
      orderBy: {
        rdvDate: 'asc' // Trier par date de RDV (les plus proches d'abord)
      }
    });

    // Calculer des stats
    const stats = {
      total: orders.length,
      aRappeler: orders.filter(o => !o.rdvRappele).length,
      rappeles: orders.filter(o => o.rdvRappele).length,
      enRetard: orders.filter(o => !o.rdvRappele && new Date(o.rdvDate) < new Date()).length,
      aujourdhui: orders.filter(o => {
        const rdvDate = new Date(o.rdvDate);
        const today = new Date();
        return !o.rdvRappele &&
               rdvDate.toDateString() === today.toDateString();
      }).length
    };

    res.json({
      orders,
      stats
    });
  } catch (error) {
    console.error('Erreur récupération RDV:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des RDV.' });
  }
});

// POST /api/rdv/:id/rappeler - Marquer un RDV comme rappelé (traité)
router.post('/:id/rappeler', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (!order.rdvProgramme) {
      return res.status(400).json({ error: 'Cette commande n\'a pas de RDV programmé.' });
    }

    // Marquer comme rappelé
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        rdvRappele: true,
        rdvProgramme: false, // Retirer le flag RDV pour que la commande retourne dans "À appeler"
        noteAppelant: note ? `${order.noteAppelant || ''}\n[RDV ${new Date().toLocaleString('fr-FR')}] ${note}`.trim() : order.noteAppelant
      }
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: order.status,
        changedBy: req.user.id,
        comment: `RDV traité - Client rappelé par ${req.user.prenom} ${req.user.nom}${note ? ' - ' + note : ''}`
      }
    });

    res.json({
      order: updatedOrder,
      message: 'RDV marqué comme traité. La commande est de nouveau disponible dans "À appeler".'
    });
  } catch (error) {
    console.error('Erreur traitement RDV:', error);
    res.status(500).json({ error: 'Erreur lors du traitement du RDV.' });
  }
});

// PUT /api/rdv/:id - Modifier un RDV existant
router.put('/:id', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rdvDate, rdvNote } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (!order.rdvProgramme) {
      return res.status(400).json({ error: 'Cette commande n\'a pas de RDV programmé.' });
    }

    // Modifier le RDV
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        rdvDate: rdvDate ? new Date(rdvDate) : order.rdvDate,
        rdvNote: rdvNote !== undefined ? rdvNote : order.rdvNote
      }
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: order.status,
        changedBy: req.user.id,
        comment: `RDV modifié par ${req.user.prenom} ${req.user.nom}`
      }
    });

    res.json({
      order: updatedOrder,
      message: 'RDV modifié avec succès.'
    });
  } catch (error) {
    console.error('Erreur modification RDV:', error);
    res.status(500).json({ error: 'Erreur lors de la modification du RDV.' });
  }
});

// DELETE /api/rdv/:id - Annuler un RDV
router.delete('/:id', authenticate, authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (!order.rdvProgramme) {
      return res.status(400).json({ error: 'Cette commande n\'a pas de RDV programmé.' });
    }

    // Annuler le RDV
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        rdvProgramme: false,
        rdvDate: null,
        rdvNote: null,
        rdvRappele: false
      }
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: order.status,
        changedBy: req.user.id,
        comment: `RDV annulé par ${req.user.prenom} ${req.user.nom}`
      }
    });

    res.json({
      order: updatedOrder,
      message: 'RDV annulé. La commande est de nouveau disponible dans "À appeler".'
    });
  } catch (error) {
    console.error('Erreur annulation RDV:', error);
    res.status(500).json({ error: 'Erreur lors de l\'annulation du RDV.' });
  }
});

export default router;




