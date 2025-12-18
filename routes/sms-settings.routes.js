/**
 * Routes API pour la gestion des paramètres SMS
 */

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Configuration SMS (types de SMS activables/désactivables)
const SMS_TYPES = [
  { 
    key: 'SMS_ORDER_CREATED', 
    label: 'Commande reçue', 
    description: 'SMS envoyé quand une nouvelle commande est créée',
    icon: '📥',
    category: 'Commandes'
  },
  { 
    key: 'SMS_ORDER_VALIDATED', 
    label: 'Commande validée', 
    description: 'SMS envoyé quand une commande est validée par un appelant',
    icon: '✅',
    category: 'Commandes'
  },
  { 
    key: 'SMS_ORDER_DELIVERED', 
    label: 'Commande livrée', 
    description: 'SMS envoyé quand une commande est marquée comme livrée',
    icon: '📦',
    category: 'Commandes'
  },
  { 
    key: 'SMS_ORDER_CANCELLED', 
    label: 'Commande annulée', 
    description: 'SMS envoyé quand une commande est annulée',
    icon: '❌',
    category: 'Commandes'
  },
  { 
    key: 'SMS_DELIVERY_ASSIGNED', 
    label: 'Livreur assigné', 
    description: 'SMS envoyé au client avec les infos du livreur',
    icon: '🚚',
    category: 'Livraison'
  },
  { 
    key: 'SMS_EXPEDITION_CONFIRMED', 
    label: 'Expédition confirmée', 
    description: 'SMS envoyé quand un colis est expédié (paiement 100%)',
    icon: '📦',
    category: 'Expédition'
  },
  { 
    key: 'SMS_EXPRESS_ARRIVED', 
    label: 'EXPRESS arrivé en agence', 
    description: 'SMS avec code de retrait quand le colis arrive en agence',
    icon: '🏢',
    category: 'Express'
  },
  { 
    key: 'SMS_EXPRESS_REMINDER', 
    label: 'Rappel retrait EXPRESS', 
    description: 'Rappel automatique si le colis n\'est pas retiré après 3 jours',
    icon: '⏰',
    category: 'Express'
  },
  { 
    key: 'SMS_RDV_SCHEDULED', 
    label: 'RDV programmé', 
    description: 'SMS de confirmation quand un RDV est programmé',
    icon: '📅',
    category: 'RDV'
  },
  { 
    key: 'SMS_RDV_REMINDER', 
    label: 'Rappel RDV', 
    description: 'Rappel automatique 1h avant le RDV',
    icon: '⏰',
    category: 'RDV'
  },
  { 
    key: 'SMS_DELIVERER_ALERT', 
    label: 'Alerte livreur', 
    description: 'SMS envoyé au livreur pour nouvelle livraison assignée',
    icon: '🔔',
    category: 'Interne'
  }
];

/**
 * GET /api/sms-settings
 * Récupérer tous les paramètres SMS
 */
router.get('/', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const settings = SMS_TYPES.map(type => ({
      ...type,
      enabled: process.env[type.key] === 'true'
    }));

    res.json({
      success: true,
      globalEnabled: process.env.SMS_ENABLED === 'true',
      androidConfig: {
        deviceId: process.env.SMS_DEVICE_ID || null,
        simSlot: process.env.SMS_SIM_SLOT || null,
        senderNumber: process.env.SMS_SENDER_NUMBER || null
      },
      settings
    });
  } catch (error) {
    console.error('❌ Erreur récupération paramètres SMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sms-settings/categories
 * Récupérer les paramètres groupés par catégorie
 */
router.get('/categories', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const categories = {};
    
    SMS_TYPES.forEach(type => {
      if (!categories[type.category]) {
        categories[type.category] = [];
      }
      categories[type.category].push({
        ...type,
        enabled: process.env[type.key] === 'true'
      });
    });

    res.json({
      success: true,
      globalEnabled: process.env.SMS_ENABLED === 'true',
      categories
    });
  } catch (error) {
    console.error('❌ Erreur récupération catégories SMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/sms-settings/stats
 * Statistiques d'utilisation par type de SMS
 */
router.get('/stats', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Stats par type de SMS (30 derniers jours)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await prisma.smsLog.groupBy({
      by: ['type', 'status'],
      where: {
        sentAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: true
    });

    // Formater les stats
    const formattedStats = {};
    
    stats.forEach(stat => {
      if (!formattedStats[stat.type]) {
        formattedStats[stat.type] = { sent: 0, failed: 0, total: 0 };
      }
      
      if (stat.status === 'SENT') {
        formattedStats[stat.type].sent += stat._count;
      } else if (stat.status === 'FAILED') {
        formattedStats[stat.type].failed += stat._count;
      }
      
      formattedStats[stat.type].total += stat._count;
    });

    await prisma.$disconnect();

    res.json({
      success: true,
      period: '30 derniers jours',
      stats: formattedStats
    });
  } catch (error) {
    console.error('❌ Erreur stats SMS par type:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/sms-settings/toggle
 * Activer/Désactiver un type de SMS spécifique
 * 
 * NOTE: Cette route met à jour process.env en mémoire UNIQUEMENT
 * Les changements sont temporaires et seront perdus au redémarrage
 * Pour des changements permanents, il faut modifier les variables sur Railway
 */
router.put('/toggle', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { key, enabled } = req.body;

    // Validation
    if (!key) {
      return res.status(400).json({
        success: false,
        error: 'La clé du paramètre est requise'
      });
    }

    // Vérifier que la clé existe
    const setting = SMS_TYPES.find(t => t.key === key);
    if (!setting) {
      return res.status(400).json({
        success: false,
        error: 'Paramètre SMS invalide'
      });
    }

    // Mettre à jour la variable d'environnement (temporaire)
    process.env[key] = enabled ? 'true' : 'false';

    console.log(`⚙️  Paramètre SMS mis à jour: ${key} = ${enabled}`);

    res.json({
      success: true,
      message: 'Paramètre mis à jour (temporaire)',
      warning: 'Ce changement est temporaire. Pour le rendre permanent, modifiez les variables sur Railway.',
      setting: {
        ...setting,
        enabled: enabled
      }
    });
  } catch (error) {
    console.error('❌ Erreur toggle paramètre SMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/sms-settings/global
 * Activer/Désactiver tous les SMS
 */
router.put('/global', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { enabled } = req.body;

    // Mettre à jour SMS_ENABLED
    process.env.SMS_ENABLED = enabled ? 'true' : 'false';

    console.log(`⚙️  SMS globalement ${enabled ? 'activés' : 'désactivés'}`);

    res.json({
      success: true,
      message: `SMS ${enabled ? 'activés' : 'désactivés'} (temporaire)`,
      warning: 'Ce changement est temporaire. Pour le rendre permanent, modifiez SMS_ENABLED sur Railway.',
      globalEnabled: enabled
    });
  } catch (error) {
    console.error('❌ Erreur toggle global SMS:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/sms-settings/test/:type
 * Tester l'envoi d'un type de SMS spécifique
 */
router.post('/test/:type', authenticate, authorize('ADMIN'), async (req, res) => {
  try {
    const { type } = req.params;
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone requis'
      });
    }

    // Vérifier que le type existe
    const setting = SMS_TYPES.find(t => t.key === type);
    if (!setting) {
      return res.status(400).json({
        success: false,
        error: 'Type de SMS invalide'
      });
    }

    // Import dynamique du service SMS
    const { sendSMS, smsTemplates } = await import('../services/sms.service.js');

    // Message de test selon le type
    let message = `[TEST ${setting.label}] Ce SMS est un test du système GS-Pipeline.`;

    // Envoyer le SMS de test
    const result = await sendSMS(phoneNumber, message, {
      type: type.replace('SMS_', ''),
      userId: req.user.userId
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'SMS de test envoyé avec succès',
        smsLogId: result.smsLogId,
        phoneNumber: phoneNumber
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || 'Erreur lors de l\'envoi du SMS de test'
      });
    }
  } catch (error) {
    console.error('❌ Erreur envoi SMS de test:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
