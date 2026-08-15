import express from 'express';

import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();
import prisma from '../config/prisma.js';
import { startOfAppDay, endOfAppDay, startOfTodayAppDay } from '../utils/appDayBounds.js';
import { classifyOrderTrafficSource } from '../utils/campaign-source.util.js';

router.use(authenticate);

/**
 * Filtre période pour les stats appelant : date à laquelle l'appel a été traité
 * (calledAt ou validatedAt), avec repli sur createdAt pour les anciennes données.
 */
function callerActivityDateWhere(startDate, endDate) {
  const start = startDate ? startOfAppDay(startDate) : null;
  const end = endDate ? endOfAppDay(endDate) : null;
  if (!start && !end) return null;

  const or = [];
  const calledRange = {};
  if (start) calledRange.gte = start;
  if (end) calledRange.lte = end;
  if (Object.keys(calledRange).length) {
    or.push({ calledAt: calledRange });
  }

  const validatedRange = {};
  if (start) validatedRange.gte = start;
  if (end) validatedRange.lte = end;
  if (Object.keys(validatedRange).length) {
    or.push({
      AND: [{ calledAt: null }, { validatedAt: validatedRange }]
    });
  }

  const createdRange = {};
  if (start) createdRange.gte = start;
  if (end) createdRange.lte = end;
  if (Object.keys(createdRange).length) {
    or.push({
      AND: [{ calledAt: null }, { validatedAt: null }, { createdAt: createdRange }]
    });
  }

  return { OR: or };
}

// GET /api/stats/overview - Vue d'ensemble (Admin/Gestionnaire)
router.get('/overview', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
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

    const activityWhere = callerActivityDateWhere(startDate, endDate);
    if (activityWhere) {
      where.AND = [activityWhere];
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
      
      if (order.status === 'NOUVELLE' || order.status === 'A_APPELER') {
        return;
      }
      
      stats.totalAppels++;
      
      if (
        order.status === 'VALIDEE' || 
        order.status === 'ASSIGNEE' || 
        order.status === 'EN_LIVRAISON' || 
        order.status === 'LIVREE' || 
        order.status === 'EXPEDITION' || 
        order.status === 'EXPRESS' || 
        order.status === 'EXPRESS_ARRIVE' || 
        order.status === 'EXPRESS_LIVRE' ||
        order.status === 'RETOURNE' ||
        order.status === 'REFUSEE' ||
        order.status === 'ANNULEE_LIVRAISON'
      ) {
        stats.totalValides++;
      } else if (order.status === 'ANNULEE') {
        stats.totalAnnules++;
      } else if (order.status === 'INJOIGNABLE' || order.status === 'REPORTE') {
        stats.totalInjoignables++;
      }
      
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
      where.deliveredAt = {};
      if (startDate) {
        const start = startOfAppDay(startDate);
        if (start) where.deliveredAt.gte = start;
      }
      if (endDate) {
        const end = endOfAppDay(endDate);
        if (end) where.deliveredAt.lte = end;
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

    let startDate = startOfTodayAppDay();

    if (period === 'week') {
      startDate = new Date(startDate.getTime() - 7 * 86400000);
    } else if (period === 'month') {
      startDate = new Date(startDate);
      startDate.setUTCMonth(startDate.getUTCMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date(startDate);
      startDate.setUTCFullYear(startDate.getUTCFullYear() - 1);
    }

    if (user.role === 'APPELANT') {
      const activityOr = [
        { calledAt: { gte: startDate } },
        { AND: [{ calledAt: null }, { validatedAt: { gte: startDate } }] },
        { AND: [{ calledAt: null }, { validatedAt: null }, { createdAt: { gte: startDate } }] }
      ];
      const orders = await prisma.order.findMany({
        where: {
          callerId: user.id,
          OR: activityOr
        },
        select: {
          id: true,
          status: true,
          deliveryType: true,
          expedieAt: true,
          createdAt: true,
          calledAt: true,
          validatedAt: true
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
          return;
        }
        
        totals.totalAppels++;
        
        if (
          order.status === 'VALIDEE' || 
          order.status === 'ASSIGNEE' || 
          order.status === 'EN_LIVRAISON' || 
          order.status === 'LIVREE' || 
          order.status === 'EXPEDITION' || 
          order.status === 'EXPRESS' || 
          order.status === 'EXPRESS_ARRIVE' || 
          order.status === 'EXPRESS_LIVRE' ||
          order.status === 'RETOURNE' ||
          order.status === 'REFUSEE' ||
          order.status === 'ANNULEE_LIVRAISON'
        ) {
          totals.totalValides++;
        } else if (order.status === 'ANNULEE') {
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

// GET /api/stats/products-by-date - Statistiques par produit et par date
router.get('/products-by-date', authorize('ADMIN', 'GESTIONNAIRE', 'GESTIONNAIRE_STOCK', 'APPELANT'), async (req, res) => {
  try {
    const { date, startDate, endDate, source } = req.query;
    const requestedSource = typeof source === 'string' ? source.toLowerCase() : 'all';
    const sourceFilter = ['all', 'facebook', 'tiktok'].includes(requestedSource)
      ? requestedSource
      : 'all';

    // Filtre de date
    const dateFilter = {};
    
    // Si plage de dates (startDate et endDate)
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
    } else if (date) {
      const start = startOfAppDay(date);
      const end = endOfAppDay(date);
      if (start && end) dateFilter.createdAt = { gte: start, lte: end };
    }

    // Récupérer toutes les commandes de la date
    const orders = await prisma.order.findMany({
      where: dateFilter,
      select: {
        id: true,
        produitNom: true,
        productId: true,
        quantite: true,
        status: true,
        sourceCampagne: true,
        sourcePage: true,
        createdAt: true,
        product: {
          select: {
            id: true,
            code: true,
            nom: true,
            stockActuel: true,
            stockExpress: true
          }
        }
      }
    });

    const ordersWithTrafficSource = orders.map(order => {
      const productCode = order.product?.code || 'N/A';
      return {
        ...order,
        trafficSource: classifyOrderTrafficSource({
          campaignSource: order.sourceCampagne,
          sourcePage: order.sourcePage,
          productCode,
        })
      };
    });

    // Les compteurs des boutons restent visibles même lorsqu'une source est filtrée.
    const sourceBreakdown = ordersWithTrafficSource.reduce((acc, order) => {
      if (order.trafficSource === 'facebook') acc.facebook++;
      else if (order.trafficSource === 'tiktok') acc.tiktok++;
      else acc.other++;
      return acc;
    }, { facebook: 0, tiktok: 0, other: 0 });

    const filteredOrders = sourceFilter === 'all'
      ? ordersWithTrafficSource
      : ordersWithTrafficSource.filter(order => order.trafficSource === sourceFilter);

    // Grouper par produit et calculer les statistiques
    const productStats = {};

    filteredOrders.forEach(order => {
      // Utiliser productId si disponible, sinon produitNom
      const key = order.productId || order.produitNom;
      const productName = order.product?.nom || order.produitNom;
      const productCode = order.product?.code || 'N/A';

      if (!productStats[key]) {
        productStats[key] = {
          productId: order.productId,
          productCode,
          productName,
          stockActuel: order.product?.stockActuel || 0,
          stockExpress: order.product?.stockExpress || 0,
          totalCommandes: 0,
          totalFacebook: 0,
          totalTikTok: 0,
          totalAutresSources: 0,
          totalEnAttente: 0,
          totalValides: 0,
          totalLivres: 0,
          totalAnnules: 0,
          totalExpeditionExpress: 0,
          quantiteTotale: 0,
          quantiteEnAttente: 0,
          quantiteValidee: 0,
          quantiteLivree: 0,
          quantiteExpeditionExpress: 0
        };
      }

      const stats = productStats[key];
      
      stats.totalCommandes++;
      stats.quantiteTotale += order.quantite;

      if (order.trafficSource === 'tiktok') {
        stats.totalTikTok++;
      } else if (order.trafficSource === 'facebook') {
        stats.totalFacebook++;
      } else {
        stats.totalAutresSources++;
      }
      
      if (order.status === 'NOUVELLE' || order.status === 'A_APPELER') {
        stats.totalEnAttente++;
        stats.quantiteEnAttente += order.quantite;
      }
      
      if (
        order.status === 'VALIDEE' || 
        order.status === 'ASSIGNEE' || 
        order.status === 'LIVREE' || 
        order.status === 'REFUSEE' ||
        order.status === 'ANNULEE_LIVRAISON' ||
        order.status === 'RETOURNE' ||
        order.status === 'EXPEDITION' || 
        order.status === 'EXPRESS' || 
        order.status === 'EXPRESS_ARRIVE' || 
        order.status === 'EXPRESS_LIVRE'
      ) {
        stats.totalValides++;
        stats.quantiteValidee += order.quantite;
      }
      
      // Compter les produits livrés
      if (order.status === 'LIVREE' || order.status === 'EXPRESS_LIVRE') {
        stats.totalLivres++;
        stats.quantiteLivree += order.quantite;
      }
      
      // Compter les annulations
      if (order.status === 'ANNULEE' || order.status === 'INJOIGNABLE') {
        stats.totalAnnules++;
      }
      
      // Compter les EXPEDITION et EXPRESS
      if (
        order.status === 'EXPEDITION' || 
        order.status === 'EXPRESS' || 
        order.status === 'EXPRESS_ARRIVE' || 
        order.status === 'EXPRESS_LIVRE'
      ) {
        stats.totalExpeditionExpress++;
        stats.quantiteExpeditionExpress += order.quantite;
      }
    });

    const result = Object.values(productStats).sort((a, b) => 
      b.totalCommandes - a.totalCommandes
    );

    const totals = {
      totalCommandes: result.reduce((sum, p) => sum + p.totalCommandes, 0),
      totalFacebook: result.reduce((sum, p) => sum + p.totalFacebook, 0),
      totalTikTok: result.reduce((sum, p) => sum + p.totalTikTok, 0),
      totalAutresSources: result.reduce((sum, p) => sum + p.totalAutresSources, 0),
      totalEnAttente: result.reduce((sum, p) => sum + p.totalEnAttente, 0),
      totalValides: result.reduce((sum, p) => sum + p.totalValides, 0),
      totalLivres: result.reduce((sum, p) => sum + p.totalLivres, 0),
      totalAnnules: result.reduce((sum, p) => sum + p.totalAnnules, 0),
      totalExpeditionExpress: result.reduce((sum, p) => sum + p.totalExpeditionExpress, 0),
      quantiteTotale: result.reduce((sum, p) => sum + p.quantiteTotale, 0),
      quantiteEnAttente: result.reduce((sum, p) => sum + p.quantiteEnAttente, 0),
      quantiteValidee: result.reduce((sum, p) => sum + p.quantiteValidee, 0),
      quantiteLivree: result.reduce((sum, p) => sum + p.quantiteLivree, 0),
      quantiteExpeditionExpress: result.reduce((sum, p) => sum + p.quantiteExpeditionExpress, 0)
    };

    res.json({ 
      products: result,
      totals,
      sourceBreakdown,
      source: sourceFilter,
      startDate: startDate || date || null,
      endDate: endDate || date || null,
      count: result.length
    });
  } catch (error) {
    console.error('Erreur récupération statistiques produits par date:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques produits.' });
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
        const start = startOfAppDay(startDate);
        if (start) dateFilter.createdAt.gte = start;
      }
      if (endDate) {
        const end = endOfAppDay(endDate);
        if (end) dateFilter.createdAt.lte = end;
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













