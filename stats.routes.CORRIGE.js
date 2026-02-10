import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import prisma from '../config/prisma.js';

const router = express.Router();

router.use(authenticate);

// GET /api/stats/overview - Vue d'ensemble (Admin/Gestionnaire)
router.get('/overview', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
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

// GET /api/stats/callers - Statistiques des appelants (Admin/Gestionnaire)
// ✅ CORRIGÉ : Calcul depuis les commandes, pas depuis CallStatistic
router.get('/callers', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { startDate, endDate, callerId } = req.query;

    // Filtres de date et appelant
    const where = {
      callerId: callerId ? parseInt(callerId) : { not: null }
    };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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
      
      // Compter selon le statut
      if (order.status === 'NOUVELLE' || order.status === 'A_APPELER') {
        stats.totalAppels++;
      } else if (order.status === 'VALIDEE' || order.status === 'LIVREE' || order.status === 'EN_LIVRAISON') {
        stats.totalValides++;
      } else if (order.status === 'ANNULEE' || order.status === 'REFUSEE') {
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
      const totalTraite = caller.totalValides + caller.totalAnnules + caller.totalInjoignables;
      return {
        ...caller,
        tauxValidation: totalTraite > 0 
          ? ((caller.totalValides / totalTraite) * 100).toFixed(2)
          : 0
      };
    });

    res.json({ stats: result });
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
      if (startDate) where.deliveredAt.gte = new Date(startDate);
      if (endDate) where.deliveredAt.lte = new Date(endDate);
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

    res.json({ stats: result });
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
        if (order.status === 'NOUVELLE' || order.status === 'A_APPELER') {
          totals.totalAppels++;
        } else if (order.status === 'VALIDEE' || order.status === 'LIVREE' || order.status === 'EN_LIVRAISON') {
          totals.totalValides++;
        } else if (order.status === 'ANNULEE' || order.status === 'REFUSEE') {
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

      const totalTraite = totals.totalValides + totals.totalAnnules + totals.totalInjoignables;
      totals.tauxValidation = totalTraite > 0 
        ? ((totals.totalValides / totalTraite) * 100).toFixed(2)
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
      if (startDate) dateFilter.createdAt.gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.lte = new Date(endDate);
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
      // Export des statistiques appelants depuis les commandes
      const orders = await prisma.order.groupBy({
        by: ['callerId'],
        where: dateFilter,
        _count: { id: true }
      });
      
      const callerIds = orders.map(o => o.callerId).filter(Boolean);
      const callers = await prisma.user.findMany({
        where: { id: { in: callerIds } },
        select: { id: true, nom: true, prenom: true, email: true }
      });
      
      data = orders.map(o => {
        const caller = callers.find(c => c.id === o.callerId);
        return {
          ...caller,
          totalCommandes: o._count.id
        };
      });
    } else if (type === 'deliverers') {
      // Export des statistiques livreurs depuis les commandes
      const orders = await prisma.order.groupBy({
        by: ['delivererId'],
        where: {
          ...dateFilter,
          delivererId: { not: null }
        },
        _count: { id: true },
        _sum: { montant: true }
      });
      
      const delivererIds = orders.map(o => o.delivererId).filter(Boolean);
      const deliverers = await prisma.user.findMany({
        where: { id: { in: delivererIds } },
        select: { id: true, nom: true, prenom: true, email: true }
      });
      
      data = orders.map(o => {
        const deliverer = deliverers.find(d => d.id === o.delivererId);
        return {
          ...deliverer,
          totalLivraisons: o._count.id,
          montantTotal: o._sum.montant || 0
        };
      });
    }

    res.json({ data });
  } catch (error) {
    console.error('Erreur export données:', error);
    res.status(500).json({ error: 'Erreur lors de l\'export des données.' });
  }
});

export default router;















































