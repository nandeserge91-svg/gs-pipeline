import express from 'express';

import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
import prisma from '../config/prisma.js';

router.use(authenticate);

// GET /api/stats/overview - Vue d'ensemble (Admin/Gestionnaire)
router.get('/overview', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        // Début de journée : 00:00:00
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.gte = start;
      }
      if (endDate) {
        // Fin de journée : 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    }

    // Statistiques globales
    const [
      totalOrders,
      newOrders,
      validatedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue
    ] = await Promise.all([
      prisma.order.count({ where: dateFilter }),
      prisma.order.count({ where: { ...dateFilter, status: { in: ['NOUVELLE', 'A_APPELER'] } } }),
      prisma.order.count({ where: { ...dateFilter, status: 'VALIDEE' } }),
      prisma.order.count({ where: { ...dateFilter, status: 'LIVREE' } }),
      prisma.order.count({ where: { ...dateFilter, status: { in: ['ANNULEE', 'REFUSEE', 'ANNULEE_LIVRAISON'] } } }),
      prisma.order.aggregate({
        where: { ...dateFilter, status: 'LIVREE' },
        _sum: { montant: true }
      })
    ]);

    // Commandes par statut
    const ordersByStatus = await prisma.order.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: true
    });

    // Top produits
    const topProducts = await prisma.order.groupBy({
      by: ['produitNom'],
      where: { ...dateFilter, status: 'LIVREE' },
      _count: true,
      _sum: { montant: true },
      orderBy: { _count: { produitNom: 'desc' } },
      take: 10
    });

    // Top villes
    const topCities = await prisma.order.groupBy({
      by: ['clientVille'],
      where: { ...dateFilter, status: 'LIVREE' },
      _count: true,
      _sum: { montant: true },
      orderBy: { _count: { clientVille: 'desc' } },
      take: 10
    });

    res.json({
      overview: {
        totalOrders,
        newOrders,
        validatedOrders,
        deliveredOrders,
        cancelledOrders,
        totalRevenue: totalRevenue._sum.montant || 0,
        conversionRate: totalOrders > 0 ? ((deliveredOrders / totalOrders) * 100).toFixed(2) : 0
      },
      ordersByStatus,
      topProducts,
      topCities
    });
  } catch (error) {
    console.error('Erreur récupération statistiques overview:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques.' });
  }
});

// GET /api/stats/callers - Statistiques des appelants (Admin/Gestionnaire/Appelant)
// ✅ CORRIGÉ : Calcul depuis les commandes, pas depuis CallStatistic
// ✅ APPELANT ajouté pour voir les performances de l'équipe
router.get('/callers', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { startDate, endDate, callerId } = req.query;

    // Filtres de date et appelant
    const where = {
      callerId: callerId ? parseInt(callerId) : { not: null }
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        // Début de journée : 00:00:00
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.createdAt.gte = start;
      }
      if (endDate) {
        // Fin de journée : 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Récupérer toutes les commandes avec appelant
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        callerId: true,
        status: true,
        deliveryType: true,
        expedieAt: true,
        caller: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    // Calculer les statistiques par appelant
    const callerStats = {};
    
    orders.forEach(order => {
      const callerId = order.callerId;
      if (!callerId || !order.caller) return;
      
      if (!callerStats[callerId]) {
        callerStats[callerId] = {
          user: order.caller,
          totalAppels: 0,
          totalValides: 0,
          totalAnnules: 0,
          totalInjoignables: 0,
          totalExpeditions: 0,
          totalExpress: 0
        };
      }
      
      const stats = callerStats[callerId];
      
      // ✅ CORRECTION : Compter TOUTES les commandes dans totalAppels
      stats.totalAppels++;
      
      // Compter selon le statut
      // ✅ CORRECTION : Inclure TOUS les statuts qui représentent des commandes validées
      if (
        order.status === 'VALIDEE' || 
        order.status === 'ASSIGNEE' || 
        order.status === 'EN_LIVRAISON' || 
        order.status === 'LIVREE' || 
        order.status === 'EXPEDITION' || 
        order.status === 'EXPRESS' || 
        order.status === 'EXPRESS_ARRIVE' || 
        order.status === 'EXPRESS_LIVRE' ||
        order.status === 'RETOURNE'
      ) {
        stats.totalValides++;
      } else if (order.status === 'ANNULEE' || order.status === 'REFUSEE' || order.status === 'ANNULEE_LIVRAISON') {
        stats.totalAnnules++;
      } else if (order.status === 'INJOIGNABLE' || order.status === 'REPORTE') {
        stats.totalInjoignables++;
      }
      
      // Compter EXPEDITION et EXPRESS
      if (order.deliveryType === 'EXPEDITION' && order.expedieAt) {
        stats.totalExpeditions++;
      } else if (order.deliveryType === 'EXPRESS' && order.expedieAt) {
        stats.totalExpress++;
      }
    });

    // Récupérer TOUS les appelants actifs (même sans commandes)
    const allCallers = await prisma.user.findMany({
      where: {
        role: 'APPELANT',
        actif: true
      },
      select: {
        id: true,
        nom: true,
        prenom: true
      }
    });

    // Ajouter les appelants sans stats
    allCallers.forEach(caller => {
      if (!callerStats[caller.id]) {
        callerStats[caller.id] = {
          user: caller,
          totalAppels: 0,
          totalValides: 0,
          totalAnnules: 0,
          totalInjoignables: 0,
          totalExpeditions: 0,
          totalExpress: 0
        };
      }
    });

    // Formater le résultat
    const result = Object.values(callerStats).map(caller => {
      // ✅ CORRECTION : Taux basé sur le total d'appels
      return {
        ...caller,
        tauxValidation: caller.totalAppels > 0 
          ? ((caller.totalValides / caller.totalAppels) * 100).toFixed(2)
          : 0
      };
    });

    res.json({ callers: result });
  } catch (error) {
    console.error('Erreur récupération statistiques appelants:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques des appelants.' });
  }
});

// GET /api/stats/deliverers - Statistiques des livreurs (Admin/Gestionnaire)
// ✅ CORRIGÉ : Calcul depuis les commandes, pas depuis DeliveryStatistic
router.get('/deliverers', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate, delivererId } = req.query;

    // Filtres de date et livreur
    const where = {
      delivererId: delivererId ? parseInt(delivererId) : { not: null }
    };
    
    if (startDate || endDate) {
      where.deliveredAt = {}; // Date de livraison
      if (startDate) {
        // Début de journée : 00:00:00
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        where.deliveredAt.gte = start;
      }
      if (endDate) {
        // Fin de journée : 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.deliveredAt.lte = end;
      }
    }

    // Récupérer toutes les commandes avec livreur
    const orders = await prisma.order.findMany({
      where,
      select: {
        id: true,
        delivererId: true,
        status: true,
        montant: true,
        deliverer: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });

    // Calculer les statistiques par livreur
    const delivererStats = {};
    
    orders.forEach(order => {
      const delivererId = order.delivererId;
      if (!delivererId || !order.deliverer) return;
      
      if (!delivererStats[delivererId]) {
        delivererStats[delivererId] = {
          user: order.deliverer,
          totalLivraisons: 0,
          totalRefusees: 0,
          totalAnnulees: 0,
          montantLivre: 0
        };
      }
      
      const stats = delivererStats[delivererId];
      
      // Compter selon le statut
      if (order.status === 'LIVREE') {
        stats.totalLivraisons++;
        stats.montantLivre += order.montant;
      } else if (order.status === 'REFUSEE') {
        stats.totalRefusees++;
      } else if (order.status === 'ANNULEE_LIVRAISON') {
        stats.totalAnnulees++;
      }
    });

    // Formater le résultat
    const result = Object.values(delivererStats).map(deliverer => {
      const total = deliverer.totalLivraisons + deliverer.totalRefusees + deliverer.totalAnnulees;
      return {
        ...deliverer,
        tauxReussite: total > 0 
          ? ((deliverer.totalLivraisons / total) * 100).toFixed(2)
          : 0
      };
    });

    res.json({ deliverers: result });
  } catch (error) {
    console.error('Erreur récupération statistiques livreurs:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques des livreurs.' });
  }
});

// GET /api/stats/my-stats - Statistiques personnelles (Appelant/Livreur)
// ✅ CORRIGÉ : Calcul depuis les commandes
router.get('/my-stats', authorize('APPELANT', 'LIVREUR'), async (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const user = req.user;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    if (user.role === 'APPELANT') {
      // Récupérer les commandes de l'appelant
      const orders = await prisma.order.findMany({
        where: {
          callerId: user.id,
          createdAt: { gte: startDate }
        },
        select: {
          id: true,
          status: true,
          deliveryType: true,
          expedieAt: true,
          createdAt: true
        }
      });

      // Calculer les statistiques
      const totals = {
        totalAppels: 0,
        totalValides: 0,
        totalAnnules: 0,
        totalInjoignables: 0,
        totalExpeditions: 0,
        totalExpress: 0
      };

      orders.forEach(order => {
        // ✅ CORRECTION : Compter TOUTES les commandes dans totalAppels
        totals.totalAppels++;
        
        // ✅ CORRECTION : Inclure TOUS les statuts qui représentent des commandes validées
        if (
          order.status === 'VALIDEE' || 
          order.status === 'ASSIGNEE' || 
          order.status === 'EN_LIVRAISON' || 
          order.status === 'LIVREE' || 
          order.status === 'EXPEDITION' || 
          order.status === 'EXPRESS' || 
          order.status === 'EXPRESS_ARRIVE' || 
          order.status === 'EXPRESS_LIVRE' ||
          order.status === 'RETOURNE'
        ) {
          totals.totalValides++;
        } else if (order.status === 'ANNULEE' || order.status === 'REFUSEE' || order.status === 'ANNULEE_LIVRAISON') {
          totals.totalAnnules++;
        } else if (order.status === 'INJOIGNABLE' || order.status === 'REPORTE') {
          totals.totalInjoignables++;
        }

        if (order.deliveryType === 'EXPEDITION' && order.expedieAt) {
          totals.totalExpeditions++;
        } else if (order.deliveryType === 'EXPRESS' && order.expedieAt) {
          totals.totalExpress++;
        }
      });

      // ✅ CORRECTION : Taux basé sur le total d'appels
      totals.tauxValidation = totals.totalAppels > 0 
        ? ((totals.totalValides / totals.totalAppels) * 100).toFixed(2)
        : 0;

      res.json({ stats: totals, details: [] }); // details vide car pas besoin
    } else if (user.role === 'LIVREUR') {
      // Récupérer les commandes du livreur
      const orders = await prisma.order.findMany({
        where: {
          delivererId: user.id,
          deliveredAt: { gte: startDate }
        },
        select: {
          id: true,
          status: true,
          montant: true,
          deliveredAt: true
        }
      });

      // Calculer les statistiques
      const totals = {
        totalLivraisons: 0,
        totalRefusees: 0,
        totalAnnulees: 0,
        montantLivre: 0
      };

      orders.forEach(order => {
        if (order.status === 'LIVREE') {
          totals.totalLivraisons++;
          totals.montantLivre += order.montant;
        } else if (order.status === 'REFUSEE') {
          totals.totalRefusees++;
        } else if (order.status === 'ANNULEE_LIVRAISON') {
          totals.totalAnnulees++;
        }
      });

      const total = totals.totalLivraisons + totals.totalRefusees + totals.totalAnnulees;
      totals.tauxReussite = total > 0 
        ? ((totals.totalLivraisons / total) * 100).toFixed(2)
        : 0;

      res.json({ stats: totals, details: [] });
    }
  } catch (error) {
    console.error('Erreur récupération statistiques personnelles:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de vos statistiques.' });
  }
});

// GET /api/stats/export - Export des données (Admin)
router.get('/export', authorize('ADMIN'), async (req, res) => {
  try {
    const { type = 'orders', startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) {
        // Début de journée : 00:00:00
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        dateFilter.createdAt.gte = start;
      }
      if (endDate) {
        // Fin de journée : 23:59:59
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateFilter.createdAt.lte = end;
      }
    }

    let data;
    if (type === 'orders') {
      data = await prisma.order.findMany({
        where: dateFilter,
        include: {
          caller: { select: { nom: true, prenom: true } },
          deliverer: { select: { nom: true, prenom: true } }
        }
      });
    } else if (type === 'callers') {
      data = await prisma.callStatistic.findMany({
        where: dateFilter.createdAt ? { date: dateFilter.createdAt } : {},
        include: {
          user: { select: { nom: true, prenom: true, email: true } }
        }
      });
    } else if (type === 'deliverers') {
      data = await prisma.deliveryStatistic.findMany({
        where: dateFilter.createdAt ? { date: dateFilter.createdAt } : {},
        include: {
          user: { select: { nom: true, prenom: true, email: true } }
        }
      });
    }

    res.json({ data });
  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données.' });
  }
});

export default router;













