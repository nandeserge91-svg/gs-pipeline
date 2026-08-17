import express from 'express';

import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
import prisma from '../config/prisma.js';
import { startOfAppDay, endOfAppDay, startOfNextAppDay } from '../utils/appDayBounds.js';

router.use(authenticate);

const TOURNEE_REFUSED_STATUSES = ['REFUSEE', 'ANNULEE_LIVRAISON'];

/** Colis encore concernés par la tournée (hors commandes annulées avant tournée ou repassées en VALIDEE). */
function ordersPourComptageTournee(orders) {
  return orders.filter((o) => !['VALIDEE', 'ANNULEE'].includes(o.status));
}

/** Seules les livraisons locales doivent alimenter les alertes de retour magasin. */
function ordersLocalesPourAlerte(orders) {
  return ordersPourComptageTournee(orders).filter((o) => o.deliveryType === 'LOCAL');
}

// GET /api/stock/tournees - Liste des tournées pour gestion stock
router.get('/tournees', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { date, dateDebut, dateFin, delivererId, status } = req.query;

    const where = {};
    
    // Gestion de la plage de dates
    if (dateDebut && dateFin) {
      const s = startOfAppDay(dateDebut);
      const e = endOfAppDay(dateFin);
      if (s && e) where.date = { gte: s, lte: e };
    } else if (dateDebut) {
      const s = startOfAppDay(dateDebut);
      if (s) where.date = { gte: s };
    } else if (dateFin) {
      const e = endOfAppDay(dateFin);
      if (e) where.date = { lte: e };
    } else if (date) {
      const dayStart = startOfAppDay(date);
      const dayEndExcl = startOfNextAppDay(date);
      if (dayStart && dayEndExcl) where.date = { gte: dayStart, lt: dayEndExcl };
    }
    
    if (delivererId) where.delivererId = parseInt(delivererId);

    const deliveryLists = await prisma.deliveryList.findMany({
      where,
      include: {
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        orders: {
          select: {
            id: true,
            clientNom: true,
            clientVille: true,
            produitNom: true,
            productId: true,
            quantite: true,
            montant: true,
            status: true,
            deliveryType: true,
            noteGestionnaire: true,
            product: {
              select: {
                id: true,
                code: true,
                nom: true
              }
            }
          }
        },
        tourneeStock: true
      },
      orderBy: { createdAt: 'desc' } // Tri par date de création (les plus récentes en premier)
    });

    // Calculer les statistiques pour chaque tournée
    const now = new Date();
    const tourneesWithStats = deliveryLists.map(list => {
      const ordresTournee = ordersPourComptageTournee(list.orders);
      const ordresLocauxAlerte = ordersLocalesPourAlerte(list.orders);
      const totalOrders = ordresTournee.length;
      const livrees = ordresTournee.filter(o => o.status === 'LIVREE').length;
      const refusees = ordresTournee.filter(o => o.status === 'REFUSEE').length;
      const annulees = ordresTournee.filter(o => o.status === 'ANNULEE_LIVRAISON').length;
      const enAttente = ordresTournee.filter(o => o.status === 'ASSIGNEE').length;
      const retournes = ordresTournee.filter(o => o.status === 'RETOURNE').length;
      const colisRemisBrut = list.tourneeStock?.colisRemis || totalOrders;
      const colisRemis = Math.min(colisRemisBrut, totalOrders);
      
      // Calcul de la durée des colis chez le livreur
      let joursChezLivreur = 0;
      let dateRemise = list.tourneeStock?.colisRemisAt || list.createdAt || list.date;
      if (dateRemise && !list.tourneeStock?.colisRetourConfirme) {
        const diffTime = now.getTime() - new Date(dateRemise).getTime();
        joursChezLivreur = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      }
      
      // Colis restants (non livrés et non retournés)
      const colisRestants = list.tourneeStock?.colisRetourConfirme 
        ? 0 
        : Math.max(0, colisRemis - livrees - retournes);

      const colisLocauxRemis = Math.min(colisRemisBrut, ordresLocauxAlerte.length);
      const colisLocauxLivres = ordresLocauxAlerte.filter(o => o.status === 'LIVREE').length;
      const colisLocauxRetournes = ordresLocauxAlerte.filter(o => o.status === 'RETOURNE').length;
      const colisLocauxRestants = list.tourneeStock?.colisRetourConfirme
        ? 0
        : Math.max(0, colisLocauxRemis - colisLocauxLivres - colisLocauxRetournes);
      
      // Alertes : uniquement les livraisons locales encore chez le livreur.
      const alerteRetard = joursChezLivreur > 2 && colisLocauxRestants > 0; // Plus de 2 jours
      const alerteCritique = joursChezLivreur > 5 && colisLocauxRestants > 0; // Plus de 5 jours

      return {
        ...list,
        orders: ordresTournee,
        stats: {
          totalOrders,
          livrees,
          refusees,
          annulees,
          enAttente,
          colisRemis,
          colisRetour: list.tourneeStock?.colisRetour || 0,
          colisRestants,
          remisConfirme: list.tourneeStock?.colisRemisConfirme || false,
          retourConfirme: list.tourneeStock?.colisRetourConfirme || false,
          dateRemise: list.tourneeStock?.colisRemisAt || list.createdAt,
          dateRetour: list.tourneeStock?.colisRetourAt,
          joursChezLivreur,
          alerteRetard,
          alerteCritique
        }
      };
    });

    res.json({ tournees: tourneesWithStats });
  } catch (error) {
    console.error('Erreur récupération tournées:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des tournées.' });
  }
});

// GET /api/stock/tournees/alerts - Colis locaux encore chez les livreurs depuis au moins 3 jours.
// Cette alerte est globale et ne dépend pas de la plage de dates affichée dans l'interface.
router.get('/tournees/alerts', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const seuilJours = 3;
    const now = new Date();
    const tourneesActives = await prisma.tourneeStock.findMany({
      where: {
        colisRemisConfirme: true,
        colisRetourConfirme: false
      },
      include: {
        deliveryList: {
          include: {
            deliverer: {
              select: { id: true, nom: true, prenom: true, telephone: true }
            },
            orders: {
              select: { id: true, status: true, deliveryType: true }
            }
          }
        }
      }
    });

    const alertesParLivreur = new Map();
    for (const tourneeStock of tourneesActives) {
      const deliveryList = tourneeStock.deliveryList;
      const ordresTournee = ordersLocalesPourAlerte(deliveryList.orders);
      const totalOrders = ordresTournee.length;
      const colisRemis = Math.min(tourneeStock.colisRemis || totalOrders, totalOrders);
      const colisLivres = ordresTournee.filter((order) =>
        ['LIVREE', 'EXPRESS_LIVRE'].includes(order.status)
      ).length;
      const colisRetournes = ordresTournee.filter((order) => order.status === 'RETOURNE').length;
      const colisNonRetournes = Math.max(0, colisRemis - colisLivres - colisRetournes);
      const dateRemise = tourneeStock.colisRemisAt || deliveryList.createdAt || deliveryList.date;
      const joursChezLivreur = Math.max(
        0,
        Math.floor((now.getTime() - new Date(dateRemise).getTime()) / (1000 * 60 * 60 * 24))
      );

      if (colisNonRetournes === 0 || joursChezLivreur < seuilJours) continue;

      const deliverer = deliveryList.deliverer;
      const current = alertesParLivreur.get(deliverer.id) || {
        deliverer,
        colisNonRetournes: 0,
        tourneesConcernees: 0,
        joursMax: 0,
        plusAncienneRemise: dateRemise
      };
      current.colisNonRetournes += colisNonRetournes;
      current.tourneesConcernees += 1;
      current.joursMax = Math.max(current.joursMax, joursChezLivreur);
      if (new Date(dateRemise) < new Date(current.plusAncienneRemise)) {
        current.plusAncienneRemise = dateRemise;
      }
      alertesParLivreur.set(deliverer.id, current);
    }

    const alertes = Array.from(alertesParLivreur.values()).sort(
      (a, b) => b.joursMax - a.joursMax || b.colisNonRetournes - a.colisNonRetournes
    );

    res.json({
      seuilJours,
      totalLivreurs: alertes.length,
      totalColis: alertes.reduce((sum, alerte) => sum + alerte.colisNonRetournes, 0),
      alertes
    });
  } catch (error) {
    console.error('Erreur récupération alertes de retours:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des alertes de retours.' });
  }
});

// GET /api/stock/tournees/:id - Détail d'une tournée
router.get('/tournees/:id', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { id } = req.params;

    const deliveryList = await prisma.deliveryList.findUnique({
      where: { id: parseInt(id) },
      include: {
        deliverer: {
          select: { id: true, nom: true, prenom: true, telephone: true }
        },
        orders: {
          select: {
            id: true,
            clientNom: true,
            clientTelephone: true,
            clientVille: true,
            clientCommune: true,
            clientAdresse: true,
            produitNom: true,
            productId: true,
            quantite: true,
            montant: true,
            status: true,
            deliveryType: true,
            noteAppelant: true,
            noteLivreur: true,
            noteGestionnaire: true,
            createdAt: true,
            product: {
              select: {
                id: true,
                code: true,
                nom: true,
                prixUnitaire: true
              }
            }
          }
        },
        tourneeStock: {
          include: {
            stockMovements: {
              include: {
                product: true
              }
            }
          }
        }
      }
    });

    if (!deliveryList) {
      return res.status(404).json({ error: 'Tournée non trouvée.' });
    }

    const ordresTournee = ordersPourComptageTournee(deliveryList.orders);
    const ordresLocauxAlerte = ordersLocalesPourAlerte(deliveryList.orders);

    // Calculer les produits par tournée
    const produitsSummary = {};
    ordresTournee.forEach(order => {
      const key = order.productId || order.produitNom;
      if (!produitsSummary[key]) {
        produitsSummary[key] = {
          productId: order.productId,
          produitNom: order.produitNom,
          quantiteTotal: 0,
          quantiteLivree: 0,
          quantiteRetour: 0,
          quantiteEnCours: 0
        };
      }
      produitsSummary[key].quantiteTotal += order.quantite;
      if (order.status === 'LIVREE') {
        produitsSummary[key].quantiteLivree += order.quantite;
      } else if (['REFUSEE', 'ANNULEE_LIVRAISON', 'RETOURNE'].includes(order.status)) {
        produitsSummary[key].quantiteRetour += order.quantite;
      } else if (order.status === 'ASSIGNEE') {
        produitsSummary[key].quantiteEnCours += order.quantite;
      }
    });
    
    // Calcul des durées et statistiques détaillées
    const now = new Date();
    const dateRemise = deliveryList.tourneeStock?.colisRemisAt || deliveryList.createdAt || deliveryList.date;
    const dateRetour = deliveryList.tourneeStock?.colisRetourAt;
    
    let joursChezLivreur = 0;
    if (dateRemise && !dateRetour) {
      const diffTime = now.getTime() - new Date(dateRemise).getTime();
      joursChezLivreur = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }
    
    const colisRemisBrut = deliveryList.tourneeStock?.colisRemis || ordresTournee.length;
    const colisRemis = Math.min(colisRemisBrut, ordresTournee.length);
    const colisLivres = ordresTournee.filter(o => o.status === 'LIVREE').length;
    const colisRetournes = ordresTournee.filter(o => o.status === 'RETOURNE').length;
    const colisRestants = dateRetour
      ? 0
      : Math.max(0, colisRemis - colisLivres - colisRetournes);

    const colisLocauxRemis = Math.min(colisRemisBrut, ordresLocauxAlerte.length);
    const colisLocauxLivres = ordresLocauxAlerte.filter(o => o.status === 'LIVREE').length;
    const colisLocauxRetournes = ordresLocauxAlerte.filter(o => o.status === 'RETOURNE').length;
    const colisLocauxRestants = dateRetour
      ? 0
      : Math.max(0, colisLocauxRemis - colisLocauxLivres - colisLocauxRetournes);
    
    res.json({ 
      tournee: {
        ...deliveryList,
        orders: ordresTournee
      },
      produitsSummary: Object.values(produitsSummary),
      stats: {
        colisRemis,
        colisLivres,
        colisRetour: deliveryList.tourneeStock?.colisRetour || 0,
        colisRestants,
        dateRemise,
        dateRetour,
        joursChezLivreur,
        alerteRetard: joursChezLivreur > 2 && colisLocauxRestants > 0,
        alerteCritique: joursChezLivreur > 5 && colisLocauxRestants > 0
      }
    });
  } catch (error) {
    console.error('Erreur récupération détail tournée:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la tournée.' });
  }
});

// POST /api/stock/tournees/:id/confirm-remise - Confirmer la remise des colis
router.post('/tournees/:id/confirm-remise', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), [
  body('colisRemis').isInt({ min: 0 }).withMessage('Nombre de colis invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { colisRemis } = req.body;

    const deliveryList = await prisma.deliveryList.findUnique({
      where: { id: parseInt(id) },
      include: { orders: true }
    });

    if (!deliveryList) {
      return res.status(404).json({ error: 'Tournée non trouvée.' });
    }

    // Créer ou mettre à jour TourneeStock
    const tourneeStock = await prisma.tourneeStock.upsert({
      where: { deliveryListId: parseInt(id) },
      create: {
        deliveryListId: parseInt(id),
        colisRemis: parseInt(colisRemis),
        colisRemisConfirme: true,
        colisRemisAt: new Date(),
        colisRemisBy: req.user.id
      },
      update: {
        colisRemis: parseInt(colisRemis),
        colisRemisConfirme: true,
        colisRemisAt: new Date(),
        colisRemisBy: req.user.id
      }
    });

    res.json({ 
      tourneeStock, 
      message: `${colisRemis} colis confirmés pour la remise.` 
    });
  } catch (error) {
    console.error('Erreur confirmation remise:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de remise.' });
  }
});

// POST /api/stock/tournees/confirm-remise-group - Confirmer en une fois les
// remises encore en attente d'un bloc journalier regroupé.
router.post('/tournees/confirm-remise-group', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), [
  body('tournees').isArray({ min: 1 }).withMessage('Aucune remise à confirmer'),
  body('tournees.*.id').isInt({ min: 1 }).withMessage('Tournée invalide'),
  body('tournees.*.colisRemis').isInt({ min: 0 }).withMessage('Nombre de colis invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const tournees = Array.from(
      new Map(
        req.body.tournees.map((tournee) => [
          parseInt(tournee.id),
          {
            id: parseInt(tournee.id),
            colisRemis: parseInt(tournee.colisRemis)
          }
        ])
      ).values()
    );
    const tourneeIds = tournees.map((tournee) => tournee.id);

    const existingTournees = await prisma.deliveryList.findMany({
      where: { id: { in: tourneeIds } },
      select: { id: true }
    });

    if (existingTournees.length !== tournees.length) {
      return res.status(404).json({ error: 'Une ou plusieurs tournées sont introuvables.' });
    }

    const confirmedAt = new Date();
    const confirmations = await prisma.$transaction(
      tournees.map((tournee) => prisma.tourneeStock.upsert({
        where: { deliveryListId: tournee.id },
        create: {
          deliveryListId: tournee.id,
          colisRemis: tournee.colisRemis,
          colisRemisConfirme: true,
          colisRemisAt: confirmedAt,
          colisRemisBy: req.user.id
        },
        update: {
          colisRemis: tournee.colisRemis,
          colisRemisConfirme: true,
          colisRemisAt: confirmedAt,
          colisRemisBy: req.user.id
        }
      }))
    );
    const totalColis = tournees.reduce((sum, tournee) => sum + tournee.colisRemis, 0);

    res.json({
      confirmations,
      totalColis,
      totalTournees: tournees.length,
      message: `${totalColis} colis confirmés dans ${tournees.length} assignation(s).`
    });
  } catch (error) {
    console.error('Erreur confirmation groupée des remises:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation groupée des remises.' });
  }
});

// POST /api/stock/orders/return-to-store - Enregistrer la réception physique
// de commandes refusées/non livrées sélectionnées dans le détail d'un bloc journalier.
router.post('/orders/return-to-store', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), [
  body('orderIds').isArray({ min: 1 }).withMessage('Aucun colis refusé/non livré sélectionné'),
  body('orderIds.*').isInt({ min: 1 }).withMessage('Commande invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const orderIds = [...new Set(req.body.orderIds.map((id) => parseInt(id)))];
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      select: { id: true, status: true, deliveryListId: true, raisonRetour: true }
    });

    if (orders.length !== orderIds.length) {
      return res.status(404).json({ error: 'Un ou plusieurs colis sont introuvables.' });
    }
    if (orders.some((order) => !TOURNEE_REFUSED_STATUSES.includes(order.status))) {
      return res.status(400).json({ error: 'Seuls les colis refusés/non livrés peuvent être retournés en magasin.' });
    }

    const returnedAt = new Date();
    const result = await prisma.$transaction(async (tx) => {
      for (const order of orders) {
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'RETOURNE',
            raisonRetour: order.raisonRetour || 'CLIENT_REFUSE',
            retourneAt: returnedAt
          }
        });
        await tx.statusHistory.create({
          data: {
            orderId: order.id,
            oldStatus: order.status,
            newStatus: 'RETOURNE',
            changedBy: req.user.id,
            comment: 'Colis refusé/non livré réceptionné physiquement et retourné en magasin'
          }
        });
      }

      const deliveryListIds = [...new Set(
        orders.map((order) => order.deliveryListId).filter((id) => id !== null)
      )];
      for (const deliveryListId of deliveryListIds) {
        const tourneeStock = await tx.tourneeStock.findUnique({
          where: { deliveryListId }
        });
        if (!tourneeStock) continue;

        const deliveryOrders = ordersPourComptageTournee(await tx.order.findMany({
          where: { deliveryListId }
        }));
        const colisLivres = deliveryOrders.filter((order) => order.status === 'LIVREE').length;
        const colisRetour = deliveryOrders.filter((order) => order.status === 'RETOURNE').length;
        const colisRemis = tourneeStock.colisRemis || deliveryOrders.length;
        const retourComplet = colisRetour >= Math.max(0, colisRemis - colisLivres);

        await tx.tourneeStock.update({
          where: { deliveryListId },
          data: {
            colisLivres,
            colisRetour,
            colisRetourConfirme: tourneeStock.colisRetourConfirme || retourComplet,
            colisRetourAt: retourComplet ? returnedAt : tourneeStock.colisRetourAt,
            colisRetourBy: req.user.id
          }
        });
      }

      return { totalReturned: orders.length };
    });

    res.json({
      ...result,
      message: `${result.totalReturned} colis refusé(s)/non livré(s) retourné(s) en magasin.`
    });
  } catch (error) {
    console.error('Erreur retour en magasin des colis refusés/non livrés:', error);
    res.status(500).json({ error: 'Erreur lors du retour en magasin.' });
  }
});

// POST /api/stock/tournees/:id/confirm-retour - Confirmer le retour des colis
router.post('/tournees/:id/confirm-retour', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK'), [
  body('colisRetour').isInt({ min: 0 }).withMessage('Nombre de colis invalide')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { colisRetour, ecartMotif, raisonsRetour } = req.body;

    const deliveryList = await prisma.deliveryList.findUnique({
      where: { id: parseInt(id) },
      include: {
        orders: {
          include: { product: true }
        },
        tourneeStock: true
      }
    });

    if (!deliveryList) {
      return res.status(404).json({ error: 'Tournée non trouvée.' });
    }

    const ordresTournee = ordersPourComptageTournee(deliveryList.orders);

    // Calculer les colis livrés
    const colisLivres = ordresTournee.filter(o => o.status === 'LIVREE').length;
    const colisRemis = deliveryList.tourneeStock?.colisRemis || ordresTournee.length;
    const ecart = colisRemis - (colisLivres + parseInt(colisRetour));

    // Transaction pour tout traiter ensemble
    const result = await prisma.$transaction(async (tx) => {
      // Mettre à jour TourneeStock
      const tourneeStock = await tx.tourneeStock.update({
        where: { deliveryListId: parseInt(id) },
        data: {
          colisLivres,
          colisRetour: parseInt(colisRetour),
          colisRetourConfirme: true,
          colisRetourAt: new Date(),
          colisRetourBy: req.user.id,
          ecart,
          ecartResolu: ecart === 0,
          ecartMotif: ecart !== 0 ? ecartMotif : null
        }
      });

      // Mettre à jour les colis REFUSEE et ANNULEE_LIVRAISON vers RETOURNE avec raison
      if (raisonsRetour && typeof raisonsRetour === 'object') {
        const ordersToUpdate = deliveryList.orders.filter(o => 
          ['REFUSEE', 'ANNULEE_LIVRAISON'].includes(o.status) && 
          raisonsRetour[o.id]
        );

        for (const order of ordersToUpdate) {
          await tx.order.update({
            where: { id: order.id },
            data: {
              status: 'RETOURNE',
              raisonRetour: raisonsRetour[order.id],
              retourneAt: new Date()
            }
          });

          // Créer l'historique
          await tx.statusHistory.create({
            data: {
              orderId: order.id,
              oldStatus: order.status,
              newStatus: 'RETOURNE',
              changedBy: req.user.id,
              comment: `Retour confirmé par gestionnaire de stock - Raison: ${raisonsRetour[order.id]}`
            }
          });
        }
      }

      // ⚠️ RÈGLE MÉTIER IMPORTANTE :
      // Les produits REFUSÉS ou ANNULÉS ne sont PAS réintégrés dans le stock
      // car ils n'en sont JAMAIS sortis (seul le statut LIVREE décrémente le stock).
      // 
      // La confirmation de retour est une opération physique (réception des colis)
      // mais n'a AUCUN impact sur le stock logique qui n'a jamais bougé pour ces produits.
      //
      // Le stock ne diminue QUE lors d'une livraison réussie (LIVREE).
      // Les produits refusés/annulés restent dans le stock tout au long du processus.

      return { tourneeStock, movements: [] };
    });

    res.json({ 
      ...result,
      message: `Retour confirmé : ${colisRetour} colis retournés.${ecart !== 0 ? ` Écart de ${ecart} colis.` : ''}` 
    });
  } catch (error) {
    console.error('Erreur confirmation retour:', error);
    res.status(500).json({ error: 'Erreur lors de la confirmation de retour.' });
  }
});

// GET /api/stock/movements - Historique des mouvements de stock
router.get('/movements', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { productId, type, startDate, endDate, limit = 100 } = req.query;

    const where = {};
    if (productId) where.productId = parseInt(productId);
    if (type) where.type = type;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        const start = startOfAppDay(startDate);
        if (start) where.createdAt.gte = start;
      }
      if (endDate) {
        const end = endOfAppDay(endDate);
        if (end) where.createdAt.lte = end;
      }
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: true,
        tournee: {
          include: {
            deliveryList: {
              include: {
                deliverer: {
                  select: { nom: true, prenom: true }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit)
    });

    res.json({ movements });
  } catch (error) {
    console.error('Erreur récupération mouvements:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des mouvements.' });
  }
});

// GET /api/stock/stats - Statistiques de stock
router.get('/stats', authorize('ADMIN', 'GESTIONNAIRE_STOCK'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        const start = startOfAppDay(startDate);
        if (start) dateFilter.createdAt.gte = start;
      }
      if (endDate) {
        const end = endOfAppDay(endDate);
        if (end) dateFilter.createdAt.lte = end;
      }
    }

    const [
      totalProduits,
      produitsActifs,
      allProducts,
      totalLivraisons,
      totalRetours,
      stockTotal
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { actif: true } }),
      prisma.product.findMany({
        where: { actif: true },
        select: { stockActuel: true, stockAlerte: true }
      }),
      prisma.stockMovement.count({
        where: { ...dateFilter, type: 'LIVRAISON' }
      }),
      prisma.stockMovement.count({
        where: { ...dateFilter, type: 'RETOUR' }
      }),
      prisma.product.aggregate({
        where: { actif: true },
        _sum: { stockActuel: true }
      })
    ]);

    // Compter les produits en alerte (stock <= stock d'alerte)
    const produitsAlerteStock = allProducts.filter(p => p.stockActuel <= p.stockAlerte).length;

    res.json({
      stats: {
        totalProduits,
        produitsActifs,
        produitsAlerteStock,
        totalLivraisons,
        totalRetours,
        stockTotal: stockTotal._sum.stockActuel || 0
      }
    });
  } catch (error) {
    console.error('Erreur récupération stats stock:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
});

export default router;




