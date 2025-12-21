import express from 'express';

import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { sendSMS, smsTemplates } from '../services/sms.service.js';
import { cleanPhoneNumber } from '../utils/phone.util.js';

const router = express.Router();
import prisma from '../config/prisma.js';

// 💰 Fonction pour calculer le prix total selon la quantité et les prix variantes
function calculatePriceByQuantity(product, quantity) {
  const qty = parseInt(quantity) || 1;
  
  // Si le produit a des prix variantes définis
  if (product.prix1 || product.prix2 || product.prix3) {
    if (qty === 1 && product.prix1) {
      return product.prix1; // Prix pour 1 unité
    } else if (qty === 2 && product.prix2) {
      return product.prix2; // Prix pour 2 unités
    } else if (qty >= 3 && product.prix3) {
      return product.prix3; // Prix pour 3+ unités
    }
  }
  
  // Sinon, utiliser le prix unitaire × quantité
  return product.prixUnitaire * qty;
}

// Toutes les routes nécessitent authentification
router.use(authenticate);

// GET /api/orders - Liste des commandes (avec filtres selon rôle)
router.get('/', async (req, res) => {
  try {
    const { status, ville, produit, startDate, endDate, callerId, delivererId, deliveryType, search, page = 1, limit = 1000 } = req.query;
    const user = req.user;

    const where = {};
    const andConditions = [];

    // Filtres selon le rôle
    if (user.role === 'APPELANT') {
      // L'appelant voit :
      // 1. UNIQUEMENT les commandes NOUVELLE et A_APPELER (en attente d'appel)
      // 2. TOUTES les EXPÉDITIONS et EXPRESS (pour gestion)
      andConditions.push({
        OR: [
        { status: { in: ['NOUVELLE', 'A_APPELER'] } },
        { deliveryType: 'EXPEDITION' },
        { deliveryType: 'EXPRESS' }
        ]
      });
    } else if (user.role === 'LIVREUR') {
      // Le livreur voit uniquement ses commandes assignées
      where.delivererId = user.id;
    } else if (user.role === 'GESTIONNAIRE' || user.role === 'GESTIONNAIRE_STOCK') {
      // Le gestionnaire et gestionnaire de stock voient toutes les commandes
      // (pas de restriction)
    } else if (user.role === 'ADMIN') {
      // L'admin voit tout (pas de restriction)
    }

    // ✅ NOUVEAU : Recherche globale (nom, téléphone, référence)
    if (search) {
      andConditions.push({
        OR: [
          { clientNom: { contains: search, mode: 'insensitive' } },
          { clientTelephone: { contains: search } },
          { orderReference: { contains: search, mode: 'insensitive' } }
        ]
      });
    }

    // Filtres supplémentaires
    if (status) where.status = status;
    if (ville) where.clientVille = { contains: ville, mode: 'insensitive' };
    if (produit) where.produitNom = { contains: produit, mode: 'insensitive' };
    if (callerId) where.callerId = parseInt(callerId);
    if (delivererId) where.delivererId = parseInt(delivererId);
    if (deliveryType) where.deliveryType = deliveryType; // ✅ Appliquer le filtre deliveryType
    
    // Combiner les conditions AND
    if (andConditions.length > 0) {
      where.AND = andConditions;
    }
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // ✅ Tri intelligent pour "À appeler" :
    // 1. Les commandes renvoyées (renvoyeAAppelerAt rempli) en HAUT
    // 2. Puis les autres commandes par date de création (plus récentes en premier)
    // NULLS LAST = les commandes avec renvoyeAAppelerAt = null viennent après
    const orderBy = [
      { renvoyeAAppelerAt: 'desc' }, // Commandes renvoyées d'abord (triées par date de renvoi)
      { createdAt: 'desc' }          // Puis par date de création normale
    ];

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          caller: {
            select: { id: true, nom: true, prenom: true }
          },
          deliverer: {
            select: { id: true, nom: true, prenom: true }
          }
        },
        orderBy,
        skip,
        take: parseInt(limit)
      }),
      prisma.order.count({ where })
    ]);

    res.json({
      orders,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des commandes.' });
  }
});

// GET /api/orders/:id - Détails d'une commande
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier les permissions selon le rôle
    if (user.role === 'APPELANT' && order.callerId !== user.id && order.callerId !== null) {
      return res.status(403).json({ error: 'Accès refusé à cette commande.' });
    }
    if (user.role === 'LIVREUR' && order.delivererId !== user.id) {
      return res.status(403).json({ error: 'Accès refusé à cette commande.' });
    }

    res.json({ order });
  } catch (error) {
    console.error('Erreur récupération commande:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la commande.' });
  }
});

// POST /api/orders - Créer une commande manuellement (Admin/Gestionnaire)
router.post('/', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('clientNom').notEmpty().withMessage('Nom du client requis'),
  body('clientTelephone').notEmpty().withMessage('Téléphone requis'),
  body('clientVille').notEmpty().withMessage('Ville requise'),
  body('produitNom').notEmpty().withMessage('Nom du produit requis'),
  body('quantite').isInt({ min: 1 }).withMessage('Quantité invalide'),
  body('montant').isFloat({ min: 0 }).withMessage('Montant invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Nettoyer le numéro de téléphone (ajouter +, enlever espaces)
    const cleanedPhone = cleanPhoneNumber(req.body.clientTelephone);
    console.log(`📞 Numéro nettoyé: ${req.body.clientTelephone} → ${cleanedPhone}`);

    const orderData = {
      clientNom: req.body.clientNom,
      clientTelephone: cleanedPhone,
      clientVille: req.body.clientVille,
      clientCommune: req.body.clientCommune,
      clientAdresse: req.body.clientAdresse,
      produitNom: req.body.produitNom,
      produitPage: req.body.produitPage,
      quantite: req.body.quantite,
      montant: req.body.montant,
      sourceCampagne: req.body.sourceCampagne,
      sourcePage: req.body.sourcePage,
      status: 'NOUVELLE'
    };

    const order = await prisma.order.create({
      data: orderData
    });

    // Créer l'historique initial
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        newStatus: 'NOUVELLE',
        changedBy: req.user.id,
        comment: 'Commande créée manuellement'
      }
    });

    // 📱 Envoi SMS de confirmation (non bloquant)
    const smsEnabled = process.env.SMS_ENABLED === 'true';
    const smsOrderCreatedEnabled = process.env.SMS_ORDER_CREATED !== 'false';
    
    if (smsEnabled && smsOrderCreatedEnabled) {
      try {
        const message = await smsTemplates.orderCreated(order.clientNom, order.orderReference, order.produitNom);
        await sendSMS(order.clientTelephone, message, {
          orderId: order.id,
          type: 'ORDER_CREATED',
          userId: req.user.id
        });
        console.log(`✅ SMS envoyé pour commande ${order.orderReference}`);
      } catch (smsError) {
        console.error('⚠️ Erreur envoi SMS (non bloquante):', smsError.message);
        // Ne pas bloquer la création de commande si l'envoi SMS échoue
      }
    }

    res.status(201).json({ order, message: 'Commande créée avec succès.' });
  } catch (error) {
    console.error('Erreur création commande:', error);
    res.status(500).json({ error: 'Erreur lors de la création de la commande.' });
  }
});

// PUT /api/orders/:id/status - Changer le statut d'une commande
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note, raisonRetour } = req.body;
    const user = req.user;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifications selon le rôle
    if (user.role === 'APPELANT') {
      // L'appelant peut changer : A_APPELER -> VALIDEE/ANNULEE/INJOIGNABLE
      if (!['VALIDEE', 'ANNULEE', 'INJOIGNABLE'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide pour un appelant.' });
      }
      // Assigner l'appelant si ce n'est pas déjà fait
      if (!order.callerId) {
        await prisma.order.update({
          where: { id: parseInt(id) },
          data: { callerId: user.id, calledAt: new Date() }
        });
      }
    } else if (user.role === 'LIVREUR') {
      // Le livreur peut changer : ASSIGNEE -> LIVREE/REFUSEE/ANNULEE_LIVRAISON/RETOURNE
      if (!['LIVREE', 'REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(status)) {
        return res.status(400).json({ error: 'Statut invalide pour un livreur.' });
      }
      if (order.delivererId !== user.id) {
        return res.status(403).json({ error: 'Cette commande ne vous est pas assignée.' });
      }
    }

    // Transaction pour gérer le statut + stock de manière cohérente
    const updatedOrder = await prisma.$transaction(async (tx) => {
      // Mettre à jour le statut de la commande
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status,
          noteAppelant: user.role === 'APPELANT' && note ? note : order.noteAppelant,
          noteLivreur: user.role === 'LIVREUR' && note ? note : order.noteLivreur,
          noteGestionnaire: (user.role === 'GESTIONNAIRE' || user.role === 'ADMIN') && note ? note : order.noteGestionnaire,
          validatedAt: status === 'VALIDEE' ? new Date() : order.validatedAt,
          deliveredAt: status === 'LIVREE' ? new Date() : order.deliveredAt,
          raisonRetour: status === 'RETOURNE' && raisonRetour ? raisonRetour : order.raisonRetour,
          retourneAt: status === 'RETOURNE' ? new Date() : order.retourneAt,
          // ✅ NOUVEAU: Si la commande avait un RDV programmé, marquer comme traité
          rdvProgramme: order.rdvProgramme ? false : order.rdvProgramme,
          rdvRappele: order.rdvProgramme ? true : order.rdvRappele,
          // ✅ NOUVEAU: Réinitialiser renvoyeAAppelerAt quand la commande change de statut (sauf si A_APPELER)
          renvoyeAAppelerAt: status === 'A_APPELER' ? order.renvoyeAAppelerAt : null
        },
        include: {
          caller: {
            select: { id: true, nom: true, prenom: true }
          },
          deliverer: {
            select: { id: true, nom: true, prenom: true }
          },
          product: true
        }
      });

      // RÈGLE MÉTIER 1 : Décrémenter le stock uniquement si la commande passe à LIVRÉE
      console.log('🔍 Vérification stock - Statut:', status, '| Ancien statut:', order.status, '| ProductID:', order.productId);
      
      if (status === 'LIVREE' && order.status !== 'LIVREE' && order.productId) {
        console.log('✅ Conditions remplies pour décrémenter le stock');
        
        const product = await tx.product.findUnique({
          where: { id: order.productId }
        });

        if (product) {
          const stockAvant = product.stockActuel;
          const stockApres = stockAvant - order.quantite;
          
          console.log(`📦 STOCK UPDATE: ${product.nom} | Avant: ${stockAvant} | Après: ${stockApres} | Quantité: -${order.quantite}`);

          // Mettre à jour le stock du produit
          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: stockApres }
          });

          // Créer le mouvement de stock
          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'LIVRAISON',
              quantite: -order.quantite,
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: user.id,
              motif: `Livraison commande ${order.orderReference} - ${order.clientNom}`
            }
          });
          
          console.log('✅ Stock mis à jour et mouvement créé');
        } else {
          console.log('❌ Produit non trouvé avec ID:', order.productId);
        }
      } else {
        if (status !== 'LIVREE') console.log('⚠️ Statut n\'est pas LIVREE');
        if (order.status === 'LIVREE') console.log('⚠️ Commande déjà LIVREE');
        if (!order.productId) console.log('❌ PROBLÈME: Commande sans productId - Stock ne sera pas mis à jour');
      }

      // RÈGLE MÉTIER 2 : Réincrémenter le stock si la commande était LIVRÉE et change vers un autre statut
      // (Le livreur corrige son erreur : la livraison n'a pas été effectuée)
      if (order.status === 'LIVREE' && status !== 'LIVREE' && order.productId) {
        const product = await tx.product.findUnique({
          where: { id: order.productId }
        });

        if (product) {
          const stockAvant = product.stockActuel;
          const stockApres = stockAvant + order.quantite; // RÉINCRÉMENTER

          // Mettre à jour le stock du produit
          await tx.product.update({
            where: { id: order.productId },
            data: { stockActuel: stockApres }
          });

          // Créer le mouvement de stock (RETOUR)
          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'RETOUR',
              quantite: order.quantite, // Positif car on rajoute
              stockAvant,
              stockApres,
              orderId: order.id,
              effectuePar: user.id,
              motif: `Correction statut ${order.orderReference} - ${order.status} → ${status} - ${order.clientNom}`
            }
          });
        }
      }

      return updated;
    });

    // Créer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: status,
        changedBy: user.id,
        comment: note
      }
    });

    // Mettre à jour les statistiques
    await updateStatistics(user.id, user.role, order.status, status, order.montant);

    // 📱 Envoi SMS selon le nouveau statut (non bloquant)
    const smsEnabled = process.env.SMS_ENABLED === 'true';
    
    if (smsEnabled) {
      try {
        let smsMessage = null;
        let smsType = null;
        let smsTypeEnabled = true;

        // Déterminer le message SMS selon le nouveau statut
        switch (status) {
          case 'VALIDEE':
            smsTypeEnabled = process.env.SMS_ORDER_VALIDATED !== 'false';
            if (smsTypeEnabled) {
              smsMessage = await smsTemplates.orderValidated(
                updatedOrder.clientNom,
                updatedOrder.produitNom,
                updatedOrder.montant
              );
              smsType = 'ORDER_VALIDATED';
            }
            break;

          case 'LIVREE':
            smsTypeEnabled = process.env.SMS_ORDER_DELIVERED !== 'false';
            if (smsTypeEnabled) {
              smsMessage = await smsTemplates.orderDelivered(
                updatedOrder.clientNom,
                updatedOrder.orderReference
              );
              smsType = 'ORDER_DELIVERED';
            }
            break;

          case 'ANNULEE':
            smsMessage = await smsTemplates.orderCancelled(
              updatedOrder.clientNom,
              updatedOrder.orderReference
            );
            smsType = 'NOTIFICATION';
            break;

          // Pas de SMS automatique pour : ASSIGNEE, REFUSEE, RETOURNE, INJOIGNABLE
          // (Géré manuellement ou dans d'autres routes)
        }

        // Envoyer le SMS si un message a été déterminé
        if (smsMessage) {
          await sendSMS(updatedOrder.clientTelephone, smsMessage, {
            orderId: updatedOrder.id,
            type: smsType,
            userId: user.id
          });
          console.log(`✅ SMS ${smsType} envoyé pour commande ${updatedOrder.orderReference}`);
        }

      } catch (smsError) {
        console.error('⚠️ Erreur envoi SMS (non bloquante):', smsError.message);
        // Ne pas bloquer la mise à jour du statut si l'envoi SMS échoue
      }
    }

    res.json({ order: updatedOrder, message: 'Statut mis à jour avec succès.' });
  } catch (error) {
    console.error('Erreur mise à jour statut:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du statut.' });
  }
});

// Fonction helper pour mettre à jour les statistiques
async function updateStatistics(userId, role, oldStatus, newStatus, montant) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (role === 'APPELANT') {
    // Statistiques des appelants
    const stat = await prisma.callStatistic.findFirst({
      where: {
        userId,
        date: { gte: today }
      }
    });

    const updateData = {
      totalAppels: { increment: 1 }
    };

    if (newStatus === 'VALIDEE') updateData.totalValides = { increment: 1 };
    if (newStatus === 'ANNULEE') updateData.totalAnnules = { increment: 1 };
    if (newStatus === 'INJOIGNABLE') updateData.totalInjoignables = { increment: 1 };

    if (stat) {
      await prisma.callStatistic.update({
        where: { id: stat.id },
        data: updateData
      });
    } else {
      await prisma.callStatistic.create({
        data: {
          userId,
          date: today,
          totalAppels: 1,
          totalValides: newStatus === 'VALIDEE' ? 1 : 0,
          totalAnnules: newStatus === 'ANNULEE' ? 1 : 0,
          totalInjoignables: newStatus === 'INJOIGNABLE' ? 1 : 0
        }
      });
    }
  } else if (role === 'LIVREUR') {
    // Statistiques des livreurs
    const stat = await prisma.deliveryStatistic.findFirst({
      where: {
        userId,
        date: { gte: today }
      }
    });

    const updateData = {};
    if (newStatus === 'LIVREE') {
      updateData.totalLivraisons = { increment: 1 };
      updateData.montantLivre = { increment: montant };
    }
    if (newStatus === 'REFUSEE') updateData.totalRefusees = { increment: 1 };
    if (newStatus === 'ANNULEE_LIVRAISON') updateData.totalAnnulees = { increment: 1 };

    if (stat) {
      await prisma.deliveryStatistic.update({
        where: { id: stat.id },
        data: updateData
      });
    } else {
      await prisma.deliveryStatistic.create({
        data: {
          userId,
          date: today,
          totalLivraisons: newStatus === 'LIVREE' ? 1 : 0,
          totalRefusees: newStatus === 'REFUSEE' ? 1 : 0,
          totalAnnulees: newStatus === 'ANNULEE_LIVRAISON' ? 1 : 0,
          montantLivre: newStatus === 'LIVREE' ? montant : 0
        }
      });
    }
  }
}

// POST /api/orders/:id/renvoyer-appel - Renvoyer une commande vers "À appeler"
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.post('/:id/renvoyer-appel', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { motif } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // ✅ Empêcher UNIQUEMENT de renvoyer des commandes EXPEDITION/EXPRESS en cours ou livrées
    // Les commandes ASSIGNEE peuvent maintenant être renvoyées pour réassignation
    if (['LIVREE', 'EXPEDITION', 'EXPRESS', 'EXPRESS_ARRIVE', 'EXPRESS_LIVRE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Impossible de renvoyer une commande EXPEDITION/EXPRESS en cours ou déjà livrée.' 
      });
    }

    // Construire la note en préservant l'existante
    let noteComplete = order.noteAppelant || '';
    const wasAssigned = order.status === 'ASSIGNEE' && order.delivererId;
    
    if (motif && !noteComplete.includes('[RENVOYÉE]')) {
      noteComplete = noteComplete 
        ? `${noteComplete}\n\n--- [RENVOYÉE] ${motif}` 
        : `[RENVOYÉE] ${motif}`;
    }
    
    // Ajouter info sur l'ancien livreur si la commande était assignée
    if (wasAssigned) {
      const oldDeliverer = await prisma.user.findUnique({
        where: { id: order.delivererId },
        select: { prenom: true, nom: true }
      });
      if (oldDeliverer) {
        noteComplete += `\n[Anciennement assignée à: ${oldDeliverer.prenom} ${oldDeliverer.nom}]`;
      }
    }

    // ✅ RÉINITIALISATION COMPLÈTE de la commande comme si elle était nouvelle
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'A_APPELER',
        // Réinitialiser l'appelant
        callerId: null,
        calledAt: null,
        validatedAt: null,
        // ✅ NOUVEAU : Réinitialiser le livreur et la livraison
        delivererId: null,
        deliveryDate: null,
        deliveryListId: null,
        // ✅ NOUVEAU : Réinitialiser les RDV programmés
        rdvProgramme: false,
        rdvDate: null,
        rdvNote: null,
        rdvRappele: false,
        rdvProgrammePar: null,
        // Conserver la note avec l'historique
        noteAppelant: noteComplete,
        // ✅ NOUVEAU : Marquer comme renvoyée pour affichage prioritaire
        renvoyeAAppelerAt: new Date(),
      },
      include: {
        caller: { select: { id: true, nom: true, prenom: true } },
        deliverer: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Enregistrer l'historique
    const historyComment = wasAssigned 
      ? `Commande RÉINITIALISÉE et renvoyée vers "À appeler" par ${req.user.prenom} ${req.user.nom}${motif ? ' - Motif: ' + motif : ''} (Livreur précédent retiré)`
      : `Commande renvoyée vers "À appeler" par ${req.user.prenom} ${req.user.nom}${motif ? ' - Motif: ' + motif : ''}`;
    
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'A_APPELER',
        changedBy: req.user.id,
        comment: historyComment
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande renvoyée vers "À appeler" avec succès.' 
    });
  } catch (error) {
    console.error('Erreur renvoi commande:', error);
    res.status(500).json({ error: 'Erreur lors du renvoi de la commande.' });
  }
});

// POST /api/orders/:id/attente-paiement - Marquer une commande en attente de paiement
// Accessible par APPELANT, ADMIN et GESTIONNAIRE
router.post('/:id/attente-paiement', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande n'est pas déjà traitée
    if (!['A_APPELER', 'NOUVELLE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Cette commande a déjà été traitée.' 
      });
    }

    // Construire la note en préservant l'existante
    let noteComplete = '';
    if (order.noteAppelant) {
      // Préserver la note existante
      noteComplete = order.noteAppelant;
    }
    
    // Ajouter le message d'attente de paiement (seulement si pas déjà présent)
    const messageAttente = note 
      ? `[EN ATTENTE PAIEMENT] ${note}` 
      : '[EN ATTENTE PAIEMENT] Client prêt à payer';
    
    if (!noteComplete.includes('[EN ATTENTE PAIEMENT]')) {
      noteComplete = noteComplete 
        ? `${noteComplete}\n\n--- ${messageAttente}` 
        : messageAttente;
    }

    // Marquer en attente de paiement
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        enAttentePaiement: true,
        attentePaiementAt: new Date(),
        callerId: req.user.id, // Assigner l'appelant
        calledAt: new Date(),
        noteAppelant: noteComplete,
        // ✅ NOUVEAU: Si la commande avait un RDV programmé, marquer comme traité
        rdvProgramme: order.rdvProgramme ? false : order.rdvProgramme,
        rdvRappele: order.rdvProgramme ? true : order.rdvRappele
      },
      include: {
        caller: { select: { id: true, nom: true, prenom: true } }
      }
    });

    // Enregistrer l'historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: order.status, // Le statut ne change pas
        changedBy: req.user.id,
        comment: `Marquée "En attente de paiement" par ${req.user.prenom} ${req.user.nom}${note ? ' - Note: ' + note : ''}`
      }
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande marquée en attente de paiement.' 
    });
  } catch (error) {
    console.error('Erreur attente paiement:', error);
    res.status(500).json({ error: 'Erreur lors de la mise en attente de paiement.' });
  }
});

// PUT /api/orders/:id/quantite - Modifier la quantité d'une commande (NOUVELLE, A_APPELER, VALIDEE)
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.put('/:id/quantite', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('quantite').isInt({ min: 1 }).withMessage('La quantité doit être au minimum 1'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantite } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: { product: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est NOUVELLE, A_APPELER ou VALIDEE
    if (!['NOUVELLE', 'A_APPELER', 'VALIDEE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Seules les commandes NOUVELLE, A_APPELER ou VALIDEES peuvent être modifiées.' 
      });
    }

    // Calculer le nouveau montant basé sur le prix unitaire
    const prixUnitaire = order.montant / order.quantite;
    const nouveauMontant = prixUnitaire * quantite;

    // Pas de vérification de stock - on autorise les modifications même avec stock insuffisant
    // Le stock sera renouvelé plus tard

    // Transaction pour mettre à jour la commande et le stock
    const result = await prisma.$transaction(async (tx) => {
      // Ajuster le stock si nécessaire
      if (order.product && order.status === 'VALIDEE') {
        const differenceQuantite = quantite - order.quantite;
        
        if (order.deliveryType === 'EXPEDITION') {
          // Pour EXPEDITION, le stock a déjà été réduit lors de la création
          // Récupérer le stock actuel avant modification
          const stockAvant = order.product.stockActuel;
          const stockApres = differenceQuantite > 0 
            ? stockAvant - differenceQuantite 
            : stockAvant + Math.abs(differenceQuantite);
          
          // Ajuster selon la différence
          await tx.product.update({
            where: { id: order.product.id },
            data: {
              stockActuel: stockApres
            }
          });

          // Enregistrer le mouvement de stock
          if (differenceQuantite !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: order.product.id,
                quantite: Math.abs(differenceQuantite),
                type: differenceQuantite > 0 ? 'RESERVATION' : 'RETOUR',
                stockAvant: stockAvant,
                stockApres: stockApres,
                effectuePar: req.user.id,
                motif: `Modification quantité commande ${order.orderReference}: ${order.quantite} → ${quantite}`,
                orderId: order.id
              }
            });
          }
        } else if (order.deliveryType === 'EXPRESS') {
          // Pour EXPRESS, ajuster le stockExpress
          const stockAvant = order.product.stockExpress;
          const stockApres = differenceQuantite > 0 
            ? stockAvant - differenceQuantite 
            : stockAvant + Math.abs(differenceQuantite);
          
          await tx.product.update({
            where: { id: order.product.id },
            data: {
              stockExpress: stockApres
            }
          });

          // Enregistrer le mouvement de stock
          if (differenceQuantite !== 0) {
            await tx.stockMovement.create({
              data: {
                productId: order.product.id,
                quantite: Math.abs(differenceQuantite),
                type: differenceQuantite > 0 ? 'RESERVATION_EXPRESS' : 'ANNULATION_EXPRESS',
                stockAvant: stockAvant,
                stockApres: stockApres,
                effectuePar: req.user.id,
                motif: `Modification quantité commande ${order.orderReference}: ${order.quantite} → ${quantite}`,
                orderId: order.id
              }
            });
          }
        }
      }

      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          quantite: quantite,
          montant: nouveauMontant,
          montantRestant: order.montantRestant 
            ? (nouveauMontant - (order.montantPaye || 0)) 
            : null,
        },
        include: {
          product: true,
          caller: { select: { id: true, nom: true, prenom: true } },
          deliverer: { select: { id: true, nom: true, prenom: true } }
        }
      });

      // Enregistrer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Quantité modifiée: ${order.quantite} → ${quantite} | Montant: ${order.montant} FCFA → ${nouveauMontant} FCFA`
        }
      });

      return updatedOrder;
    });

    res.json({ 
      order: result, 
      message: `Quantité modifiée avec succès: ${order.quantite} → ${quantite}` 
    });
  } catch (error) {
    console.error('Erreur modification quantité:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la quantité.' });
  }
});

// PUT /api/orders/:id/adresse - Modifier l'adresse de livraison d'une commande VALIDEE
// Accessible uniquement par ADMIN et GESTIONNAIRE
router.put('/:id/adresse', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('clientVille').notEmpty().withMessage('La ville est requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { clientVille, clientCommune, clientAdresse } = req.body;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est VALIDEE (pas encore assignée)
    if (order.status !== 'VALIDEE') {
      return res.status(400).json({ 
        error: 'Seules les commandes VALIDEES (non assignées) peuvent avoir leur adresse modifiée.' 
      });
    }

    // Mettre à jour l'adresse
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          clientVille,
          clientCommune: clientCommune || order.clientCommune,
          clientAdresse: clientAdresse || order.clientAdresse,
        }
      });

      // Créer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: order.status,
          changedBy: req.user.id,
          comment: `Adresse modifiée: ${order.clientVille} → ${clientVille}${clientCommune ? ' | ' + clientCommune : ''}${clientAdresse ? ' | ' + clientAdresse : ''}`
        }
      });

      return updated;
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Adresse de livraison modifiée avec succès.' 
    });
  } catch (error) {
    console.error('Erreur modification adresse:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de l\'adresse.' });
  }
});

// PUT /api/orders/:id - Modifier une commande (Admin/Gestionnaire)
router.put('/:id', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };
    
    // Ne pas permettre la modification du statut par cette route
    delete updateData.status;

    const order = await prisma.order.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        caller: {
          select: { id: true, nom: true, prenom: true }
        },
        deliverer: {
          select: { id: true, nom: true, prenom: true }
        }
      }
    });

    res.json({ order, message: 'Commande modifiée avec succès.' });
  } catch (error) {
    console.error('Erreur modification commande:', error);
    res.status(500).json({ error: 'Erreur lors de la modification de la commande.' });
  }
});

// POST /api/orders/:id/expedition - Créer une EXPÉDITION (paiement 100%)
router.post('/:id/expedition', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, note } = req.body;

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande a un produit lié
    if (!order.productId) {
      return res.status(400).json({ error: 'Cette commande n\'a pas de produit associé.' });
    }

    if (!order.product) {
      return res.status(400).json({ error: 'Produit non trouvé pour cette commande.' });
    }

    if (parseFloat(montantPaye) < order.montant) {
      return res.status(400).json({ 
        error: 'Le montant payé doit être égal au montant total pour une EXPÉDITION.' 
      });
    }

    // Transaction pour mettre à jour la commande ET réduire le stock immédiatement
    const result = await prisma.$transaction(async (tx) => {
      // Récupérer le stock actuel dans la transaction pour éviter les problèmes de concurrence
      const product = await tx.product.findUnique({
        where: { id: order.productId }
      });

      if (!product) {
        throw new Error('Produit introuvable');
      }

      // Pas de blocage si stock insuffisant - on autorise le stock négatif pour EXPEDITION
      // Le stock sera renouvelé plus tard
      
      // Réduire le stock immédiatement (peut devenir négatif)
      const stockAvant = product.stockActuel;
      const stockApres = stockAvant - order.quantite;

      await tx.product.update({
        where: { id: order.productId },
        data: { stockActuel: stockApres },
      });

      // Créer un mouvement de stock
      await tx.stockMovement.create({
        data: {
          productId: order.productId,
          type: 'RESERVATION',
          quantite: -order.quantite,
          stockAvant,
          stockApres,
          orderId: order.id,
          effectuePar: req.user.id,
          motif: `Réservation stock pour EXPÉDITION ${order.orderReference} - ${order.clientNom}`
        }
      });

      // Mettre à jour la commande
      const updatedOrder = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPEDITION',
          deliveryType: 'EXPEDITION',
          montantPaye: parseFloat(montantPaye),
          montantRestant: 0,
          modePaiement,
          referencePayment,
          noteAppelant: note || order.noteAppelant,
          validatedAt: new Date(),
          expedieAt: new Date(), // ✅ Date de paiement EXPEDITION pour comptabilité
          callerId: req.user.id,
          calledAt: new Date(),
          // ✅ NOUVEAU: Si la commande avait un RDV programmé, marquer comme traité
          rdvProgramme: order.rdvProgramme ? false : order.rdvProgramme,
          rdvRappele: order.rdvProgramme ? true : order.rdvRappele
        },
      });

      // Créer l'historique
      await tx.statusHistory.create({
        data: {
          orderId: parseInt(id),
          oldStatus: order.status,
          newStatus: 'EXPEDITION',
          changedBy: req.user.id,
          comment: `EXPÉDITION - Paiement total: ${montantPaye} FCFA via ${modePaiement}${referencePayment ? ' - Réf: ' + referencePayment : ''} | Stock réduit: ${order.quantite}`,
        },
      });

      return updatedOrder;
    });

    res.json({ 
      order: result, 
      message: 'Commande transférée en EXPÉDITION avec succès. Stock réduit immédiatement.' 
    });
  } catch (error) {
    console.error('Erreur création EXPÉDITION:', error);
    // Si l'erreur vient de la transaction (throw new Error), renvoyer le message
    if (error.message) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Erreur lors de la création de l\'expédition.' });
  }
});

// POST /api/orders/:id/express - Créer un EXPRESS (paiement 10%)
router.post('/:id/express', authorize('APPELANT', 'ADMIN', 'GESTIONNAIRE'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
  body('agenceRetrait').notEmpty().withMessage('Agence de retrait requise'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment, agenceRetrait, note } = req.body;

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    const dixPourcent = order.montant * 0.10;
    const montantRestant = order.montant - parseFloat(montantPaye);

    if (parseFloat(montantPaye) < dixPourcent * 0.8) {
      return res.status(400).json({ 
        error: `Le montant payé doit être au moins 10% du total (${Math.round(dixPourcent)} FCFA).` 
      });
    }

    // Transaction pour gérer le stock EXPRESS
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPRESS',
          deliveryType: 'EXPRESS',
          montantPaye: parseFloat(montantPaye),
          montantRestant,
          modePaiement,
          referencePayment,
          agenceRetrait,
          noteAppelant: note || order.noteAppelant,
          validatedAt: new Date(),
          expedieAt: new Date(), // ✅ Date de paiement avance EXPRESS (10%) pour comptabilité
          callerId: req.user.id,
          calledAt: new Date(),
          // ✅ NOUVEAU: Si la commande avait un RDV programmé, marquer comme traité
          rdvProgramme: order.rdvProgramme ? false : order.rdvProgramme,
          rdvRappele: order.rdvProgramme ? true : order.rdvRappele
        },
      });

      // Déplacer le stock vers stock EXPRESS (réservé)
      if (order.productId && order.product) {
        const product = order.product;
        const stockNormalAvant = product.stockActuel;
        const stockExpressAvant = product.stockExpress || 0;
        const stockNormalApres = stockNormalAvant - order.quantite;
        const stockExpressApres = stockExpressAvant + order.quantite;

        // Pas de blocage si stock insuffisant - on autorise le stock négatif pour EXPRESS
        await tx.product.update({
          where: { id: order.productId },
          data: { 
            stockActuel: stockNormalApres,
            stockExpress: stockExpressApres,
          },
        });

        // Créer mouvement de réservation EXPRESS
        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: 'RESERVATION_EXPRESS',
            quantite: order.quantite,
            stockAvant: stockNormalAvant,
            stockApres: stockNormalApres,
            effectuePar: req.user.id,
            motif: `Réservation EXPRESS - ${order.orderReference} - Acompte payé, en attente retrait agence ${agenceRetrait}`,
          },
        });
      }

      return updated;
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS',
        changedBy: req.user.id,
        comment: `EXPRESS - Acompte: ${montantPaye} FCFA via ${modePaiement} | Restant: ${Math.round(montantRestant)} FCFA | Agence: ${agenceRetrait}${referencePayment ? ' - Réf: ' + referencePayment : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Commande transférée en EXPRESS avec succès. Stock réservé.' 
    });
  } catch (error) {
    console.error('Erreur création EXPRESS:', error);
    res.status(500).json({ error: 'Erreur lors de la création de l\'express.' });
  }
});

// PUT /api/orders/:id/express/arrive - Marquer un EXPRESS comme arrivé en agence (avec code + photo optionnels)
router.put('/:id/express/arrive', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT', 'LIVREUR'), async (req, res) => {
  try {
    const { id } = req.params;
    const { codeExpedition, photoRecuExpedition, note } = req.body;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS' && order.status !== 'ASSIGNEE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas un EXPRESS en attente.' });
    }

    // Vérifier que le livreur est bien assigné (si c'est un livreur qui fait la requête)
    if (req.user.role === 'LIVREUR' && order.delivererId !== req.user.id) {
      return res.status(403).json({ error: 'Cet EXPRESS ne vous est pas assigné.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'EXPRESS_ARRIVE',
        arriveAt: new Date(),
        codeExpedition: codeExpedition ? codeExpedition.trim() : order.codeExpedition,
        photoRecuExpedition: photoRecuExpedition ? photoRecuExpedition.trim() : order.photoRecuExpedition,
        photoRecuExpeditionUploadedAt: photoRecuExpedition ? new Date() : order.photoRecuExpeditionUploadedAt,
        noteLivreur: note || order.noteLivreur,
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Colis arrivé en agence: ${order.agenceRetrait}${codeExpedition ? ' - Code: ' + codeExpedition : ''}${note ? ' - ' + note : ''}`,
      },
    });

    // 📱 Envoi SMS automatique pour notifier le client (non bloquant)
    const smsEnabled = process.env.SMS_ENABLED === 'true';
    const smsExpressArrivedEnabled = process.env.SMS_EXPRESS_ARRIVED !== 'false';
    
    if (smsEnabled && smsExpressArrivedEnabled && updatedOrder.codeExpedition) {
      try {
        const message = await smsTemplates.expressArrived(
          updatedOrder.clientNom,
          updatedOrder.agenceRetrait || 'notre agence',
          updatedOrder.codeExpedition,
          Math.round(updatedOrder.montantRestant || (updatedOrder.montant * 0.90))
        );
        
        await sendSMS(updatedOrder.clientTelephone, message, {
          orderId: updatedOrder.id,
          type: 'EXPRESS_ARRIVED',
          userId: req.user.id
        });
        
        console.log(`✅ SMS EXPRESS arrivé envoyé pour commande ${updatedOrder.orderReference}`);
      } catch (smsError) {
        console.error('⚠️ Erreur envoi SMS EXPRESS (non bloquante):', smsError.message);
      }
    }

    res.json({ 
      order: updatedOrder, 
      message: 'Colis marqué comme arrivé en agence.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour.' });
  }
});

// POST /api/orders/:id/express/notifier - Notifier le client (EXPRESS arrivé)
router.post('/:id/express/notifier', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({ where: { id: parseInt(id) } });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas arrivée en agence.' });
    }

    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        clientNotifie: true,
        notifieAt: new Date(),
        notifiePar: req.user.id,
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_ARRIVE',
        changedBy: req.user.id,
        comment: `Client ${order.clientNom} notifié de l'arrivée du colis à l'agence ${order.agenceRetrait}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'Client notifié avec succès.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la notification.' });
  }
});

// POST /api/orders/:id/expedition/livrer - Livreur confirme livraison EXPÉDITION
router.post('/:id/expedition/livrer', authorize('LIVREUR', 'ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { codeExpedition, note, photoRecuExpedition } = req.body;

    // Validation : Code d'expédition obligatoire
    if (!codeExpedition || !codeExpedition.trim()) {
      return res.status(400).json({ error: 'Le code d\'expédition est obligatoire.' });
    }

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPEDITION' && order.status !== 'ASSIGNEE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas une EXPÉDITION ou n\'est pas assignée.' });
    }
    
    // Vérifier que le livreur est bien assigné à cette commande
    if (req.user.role === 'LIVREUR' && order.delivererId !== req.user.id) {
      return res.status(403).json({ error: 'Cette expédition ne vous est pas assignée.' });
    }

    // Mettre à jour la commande (PAS de réduction de stock car déjà réduit lors de la création EXPÉDITION)
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        status: 'LIVREE',
        deliveredAt: new Date(),
        delivererId: req.user.id || order.delivererId,
        noteLivreur: note || order.noteLivreur,
        codeExpedition: codeExpedition.trim(),
        photoRecuExpedition: photoRecuExpedition ? photoRecuExpedition.trim() : null, // ✅ Photo facultative
        photoRecuExpeditionUploadedAt: photoRecuExpedition ? new Date() : null, // ✅ Date si photo présente
        expedieAt: new Date(),
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'LIVREE',
        changedBy: req.user.id,
        comment: `EXPÉDITION confirmée comme livrée/expédiée par ${req.user.prenom} ${req.user.nom}${note ? ' - ' + note : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'EXPÉDITION confirmée comme expédiée/livrée.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de livraison.' });
  }
});

// POST /api/orders/:id/express/finaliser - Finaliser EXPRESS (paiement des 90% restants)
router.post('/:id/express/finaliser', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), [
  body('montantPaye').isFloat({ min: 0 }).withMessage('Montant invalide'),
  body('modePaiement').notEmpty().withMessage('Mode de paiement requis'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { montantPaye, modePaiement, referencePayment } = req.body;

    const order = await prisma.order.findUnique({ 
      where: { id: parseInt(id) },
      include: { product: true }
    });
    
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    if (order.status !== 'EXPRESS_ARRIVE') {
      return res.status(400).json({ error: 'Cette commande n\'est pas arrivée en agence.' });
    }

    const montantTotal = (order.montantPaye || 0) + parseFloat(montantPaye);
    
    if (montantTotal < order.montant * 0.95) {
      return res.status(400).json({ 
        error: `Le montant total payé (${Math.round(montantTotal)} FCFA) est insuffisant. Attendu: ${Math.round(order.montant)} FCFA.` 
      });
    }

    // Transaction pour gérer le stock
    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: parseInt(id) },
        data: {
          status: 'EXPRESS_LIVRE',
          montantPaye: montantTotal,
          montantRestant: 0,
          deliveredAt: new Date(),
        },
      });

      // Réduire le stock EXPRESS (pas le stock normal, déjà déplacé lors de la création)
      if (order.productId && order.product) {
        const product = order.product;
        const stockExpressAvant = product.stockExpress || 0;
        const stockExpressApres = stockExpressAvant - order.quantite;

        await tx.product.update({
          where: { id: order.productId },
          data: { stockExpress: stockExpressApres },
        });

        await tx.stockMovement.create({
          data: {
            productId: order.productId,
            type: 'RETRAIT_EXPRESS',
            quantite: -order.quantite,
            stockAvant: stockExpressAvant,
            stockApres: stockExpressApres,
            effectuePar: req.user.id,
            motif: `EXPRESS retiré par client - ${order.orderReference} - Agence: ${order.agenceRetrait}`,
          },
        });
      }

      return updated;
    });

    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: 'EXPRESS_ARRIVE',
        newStatus: 'EXPRESS_LIVRE',
        changedBy: req.user.id,
        comment: `Paiement final: ${montantPaye} FCFA via ${modePaiement} | Total payé: ${Math.round(montantTotal)} FCFA${referencePayment ? ' - Réf: ' + referencePayment : ''}`,
      },
    });

    res.json({ 
      order: updatedOrder, 
      message: 'EXPRESS finalisé avec succès.' 
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la finalisation.' });
  }
});

// POST /api/orders/:id/expedition/assign - Assigner un livreur à une EXPÉDITION ou EXPRESS
router.post('/:id/expedition/assign', authorize('ADMIN', 'GESTIONNAIRE'), [
  body('delivererId').isInt().withMessage('Livreur invalide'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { delivererId } = req.body;
    const orderId = parseInt(id);

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }
    
    // ✅ Accepter EXPEDITION et EXPRESS
    if (order.status !== 'EXPEDITION' && order.status !== 'EXPRESS') {
      return res.status(400).json({ error: 'Seules les commandes EXPÉDITION et EXPRESS peuvent être assignées à un livreur.' });
    }

    // Vérifier que le livreur existe
    const deliverer = await prisma.user.findUnique({
      where: { id: parseInt(delivererId) }
    });

    if (!deliverer || deliverer.role !== 'LIVREUR') {
      return res.status(400).json({ error: 'Livreur invalide.' });
    }

    // ✅ Adapter le nom selon le type
    const typeName = order.status === 'EXPRESS' ? 'EXPRESS' : 'EXPÉDITION';
    const deliveryDate = new Date();
    const deliveryList = await prisma.deliveryList.create({
      data: {
        nom: `${typeName} ${order.orderReference} - ${order.agenceRetrait || order.clientVille}`,
        date: deliveryDate,
        delivererId: parseInt(delivererId),
        zone: order.agenceRetrait || order.clientVille
      }
    });

    // ✅ Assigner le livreur sans changer le statut pour EXPRESS (reste EXPRESS)
    // Pour EXPEDITION, passe en ASSIGNEE
    const newStatus = order.status === 'EXPRESS' ? 'EXPRESS' : 'ASSIGNEE';

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        delivererId: parseInt(delivererId),
        deliveryListId: deliveryList.id,
        deliveryDate: deliveryDate,
        ...(order.status === 'EXPEDITION' && { status: 'ASSIGNEE' })
      },
    });

    await prisma.statusHistory.create({
      data: {
        orderId: order.id,
        oldStatus: order.status,
        newStatus: newStatus,
        changedBy: req.user.id,
        comment: `${typeName} assignée au livreur ${deliverer.prenom} ${deliverer.nom} pour livraison vers ${order.agenceRetrait || order.clientVille}.`
      }
    });

    res.json({ 
      order: updatedOrder,
      deliveryList,
      message: `${typeName} assignée au livreur avec succès.${order.status === 'EXPEDITION' ? ' Le gestionnaire de stock doit confirmer la remise du colis.' : ''}` 
    });
  } catch (error) {
    console.error('Erreur lors de l\'assignation du livreur:', error);
    res.status(500).json({ error: error.message || 'Erreur lors de l\'assignation du livreur.' });
  }
});

// DELETE /api/orders/:id - Supprimer une commande (Admin uniquement)
router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;

    // Récupérer la commande avec ses informations de produit
    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) },
      include: {
        product: true
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Transaction pour gérer la suppression et la restauration du stock
    await prisma.$transaction(async (tx) => {
      // Restaurer le stock si nécessaire selon le type et statut
      if (order.productId && order.product) {
        let needsStockRestoration = false;
        let stockField = 'stockActuel';

        // EXPÉDITION : stock réduit dès la création, restaurer si pas encore livrée
        if (order.deliveryType === 'EXPEDITION' && ['EXPEDITION', 'ASSIGNEE'].includes(order.status)) {
          needsStockRestoration = true;
          stockField = 'stockActuel';
        }
        
        // EXPRESS : stock EXPRESS réduit, restaurer si statuts EXPRESS ou EXPRESS_ARRIVE
        else if (order.deliveryType === 'EXPRESS' && ['EXPRESS', 'EXPRESS_ARRIVE'].includes(order.status)) {
          needsStockRestoration = true;
          stockField = 'stockExpress';
        }

        // Commandes livrées : stock déjà réduit, restaurer
        else if (order.status === 'LIVREE' || order.status === 'EXPRESS_LIVRE') {
          needsStockRestoration = true;
          stockField = order.deliveryType === 'EXPRESS' ? 'stockExpress' : 'stockActuel';
        }

        if (needsStockRestoration) {
          const currentStock = order.product[stockField];
          const newStock = currentStock + order.quantite;

          // Restaurer le stock
          await tx.product.update({
            where: { id: order.productId },
            data: { [stockField]: newStock }
          });

          // Créer un mouvement de stock pour la restauration
          await tx.stockMovement.create({
            data: {
              productId: order.productId,
              type: 'CORRECTION',
              quantite: order.quantite,
              stockAvant: currentStock,
              stockApres: newStock,
              effectuePar: req.user.id,
              motif: `Restauration ${stockField} suite à suppression de la commande ${order.orderReference} (${order.deliveryType || 'LOCALE'})`
            }
          });
        }
      }

      // Supprimer les mouvements de stock liés à cette commande
      await tx.stockMovement.deleteMany({
        where: { orderId: parseInt(id) }
      });

      // Supprimer l'historique des statuts
      await tx.statusHistory.deleteMany({
        where: { orderId: parseInt(id) }
      });

      // Supprimer la commande
      await tx.order.delete({
        where: { id: parseInt(id) }
      });
    });

    res.json({ message: 'Commande supprimée avec succès.' });
  } catch (error) {
    console.error('Erreur suppression commande:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de la commande.' });
  }
});

// POST /api/orders/:id/prioritize - Faire remonter une commande en haut de la liste (Admin/Gestionnaire)
router.post('/:id/prioritize', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Vérifier que la commande est bien "À appeler"
    if (!['NOUVELLE', 'A_APPELER', 'INJOIGNABLE', 'RETOURNE'].includes(order.status)) {
      return res.status(400).json({ 
        error: 'Seules les commandes "À appeler" peuvent être priorisées.' 
      });
    }

    // Mettre à jour renvoyeAAppelerAt pour faire remonter en haut
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        renvoyeAAppelerAt: new Date(), // Date actuelle pour tri en haut
        status: 'A_APPELER' // Forcer le statut à A_APPELER si c'était NOUVELLE
      }
    });

    // Créer un historique
    await prisma.statusHistory.create({
      data: {
        orderId: parseInt(id),
        oldStatus: order.status,
        newStatus: 'A_APPELER',
        changedBy: req.user.id,
        comment: `📌 Commande priorisée par ${req.user.prenom} ${req.user.nom} - Remontée en haut de la liste`
      }
    });

    res.json({ 
      order: updatedOrder,
      message: 'Commande priorisée avec succès. Elle apparaîtra en haut de la liste "À appeler".' 
    });
  } catch (error) {
    console.error('Erreur priorisation commande:', error);
    res.status(500).json({ error: 'Erreur lors de la priorisation de la commande.' });
  }
});

// POST /api/orders/:id/unprioritize - Retirer la priorité d'une commande (Admin/Gestionnaire)
router.post('/:id/unprioritize', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findUnique({
      where: { id: parseInt(id) }
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée.' });
    }

    // Retirer la priorité
    const updatedOrder = await prisma.order.update({
      where: { id: parseInt(id) },
      data: {
        renvoyeAAppelerAt: null // Retirer la date de priorisation
      }
    });

    res.json({ 
      order: updatedOrder,
      message: 'Priorité retirée avec succès.' 
    });
  } catch (error) {
    console.error('Erreur dé-priorisation commande:', error);
    res.status(500).json({ error: 'Erreur lors de la dé-priorisation de la commande.' });
  }
});

export default router;




