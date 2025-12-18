/**
 * 📱 ROUTES SMS - Gestion et monitoring des SMS
 * 
 * Routes pour consulter l'historique, les statistiques et tester l'envoi de SMS
 */

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { 
  sendSMS, 
  smsTemplates, 
  getSMSCredits, 
  getSMSStats, 
  getSMSHistory 
} from '../services/sms.service.js';

const router = express.Router();

// Toutes les routes nécessitent authentification
router.use(authenticate);

/**
 * GET /api/sms/history - Historique des SMS envoyés
 * Permissions : ADMIN, GESTIONNAIRE
 */
router.get('/history', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { orderId, userId, status, type, startDate, endDate, limit = 100 } = req.query;

    const filters = {
      orderId: orderId ? parseInt(orderId) : undefined,
      userId: userId ? parseInt(userId) : undefined,
      status,
      type,
      startDate,
      endDate,
      limit: parseInt(limit)
    };

    const result = await getSMSHistory(filters);

    if (result.success) {
      res.json({
        success: true,
        logs: result.logs,
        count: result.count
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur récupération historique SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de l\'historique SMS.'
    });
  }
});

/**
 * GET /api/sms/stats - Statistiques SMS
 * Permissions : ADMIN, GESTIONNAIRE
 */
router.get('/stats', authorize('ADMIN', 'GESTIONNAIRE'), async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const result = await getSMSStats(parseInt(days));

    if (result.success) {
      res.json({
        success: true,
        stats: {
          period: result.period,
          total: result.total,
          sent: result.sent,
          failed: result.failed,
          successRate: result.successRate
        }
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur récupération statistiques SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des statistiques SMS.'
    });
  }
});

/**
 * GET /api/sms/credits - Solde de crédits SMS
 * Permissions : ADMIN
 */
router.get('/credits', authorize('ADMIN'), async (req, res) => {
  try {
    const result = await getSMSCredits();

    if (result.success) {
      res.json({
        success: true,
        credits: result.credits,
        message: result.message
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur récupération crédits SMS:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des crédits SMS.'
    });
  }
});

/**
 * POST /api/sms/test - Tester l'envoi d'un SMS
 * Permissions : ADMIN
 */
router.post('/test', authorize('ADMIN'), async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;

    // Validation
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone et message requis.'
      });
    }

    if (message.length > 160) {
      return res.status(400).json({
        success: false,
        error: 'Le message ne doit pas dépasser 160 caractères.'
      });
    }

    // Envoi du SMS de test
    const result = await sendSMS(phoneNumber, message, {
      type: 'NOTIFICATION',
      userId: req.user.id
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'SMS de test envoyé avec succès.',
        smsLogId: result.smsLogId,
        credits: result.credits
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur envoi SMS test:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du SMS de test.'
    });
  }
});

/**
 * GET /api/sms/templates - Liste des templates SMS disponibles
 * Permissions : ADMIN, GESTIONNAIRE, APPELANT
 */
router.get('/templates', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    // Liste des templates avec exemples (génération asynchrone)
    const templates = await Promise.all([
      {
        id: 'orderCreated',
        name: 'Commande créée',
        description: 'Notification lors de la création d\'une commande',
        example: await smsTemplates.orderCreated('John Doe', 'ORD-12345'),
        parameters: ['clientNom', 'orderReference']
      },
      {
        id: 'orderValidated',
        name: 'Commande validée',
        description: 'Notification lors de la validation d\'une commande',
        example: await smsTemplates.orderValidated('John Doe', 'BEE VENOM', 10000),
        parameters: ['clientNom', 'produitNom', 'montant']
      },
      {
        id: 'deliveryAssigned',
        name: 'Livreur assigné',
        description: 'Notification quand un livreur est assigné',
        example: await smsTemplates.deliveryAssigned('John Doe', 'Mohamed', '+2250712345678'),
        parameters: ['clientNom', 'livreurNom', 'telephone']
      },
      {
        id: 'orderDelivered',
        name: 'Commande livrée',
        description: 'Notification après livraison réussie',
        example: await smsTemplates.orderDelivered('John Doe', 'ORD-12345'),
        parameters: ['clientNom', 'orderReference']
      },
      {
        id: 'expeditionConfirmed',
        name: 'Expédition confirmée',
        description: 'Notification EXPEDITION avec code de suivi',
        example: await smsTemplates.expeditionConfirmed('John Doe', 'EXP-2024-12345', 'Yamoussoukro'),
        parameters: ['clientNom', 'codeExpedition', 'ville']
      },
      {
        id: 'expressArrived',
        name: 'EXPRESS arrivé en agence',
        description: 'Notification arrivée EXPRESS avec code retrait',
        example: await smsTemplates.expressArrived('John Doe', 'Agence Cocody', 'EXP-2024-789', 9000),
        parameters: ['clientNom', 'agence', 'codeExpedition', 'montantRestant']
      },
      {
        id: 'expressReminder',
        name: 'Rappel retrait EXPRESS',
        description: 'Rappel si colis non retiré après plusieurs jours',
        example: await smsTemplates.expressReminder('John Doe', 'Agence Cocody', 'EXP-2024-789', 3),
        parameters: ['clientNom', 'agence', 'codeExpedition', 'joursAttente']
      },
      {
        id: 'rdvScheduled',
        name: 'RDV programmé',
        description: 'Confirmation de programmation de RDV',
        example: await smsTemplates.rdvScheduled('John Doe', '20/12/2024', '14:00'),
        parameters: ['clientNom', 'rdvDate', 'rdvHeure']
      },
      {
        id: 'rdvReminder',
        name: 'Rappel RDV',
        description: 'Rappel 1h avant le RDV',
        example: await smsTemplates.rdvReminder('John Doe', '14:00'),
        parameters: ['clientNom', 'rdvHeure']
      }
    ]);

    res.json({
      success: true,
      templates,
      count: templates.length
    });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des templates.'
    });
  }
});

/**
 * GET /api/sms/config - Configuration SMS actuelle
 * Permissions : ADMIN
 */
router.get('/config', authorize('ADMIN'), async (req, res) => {
  try {
    const config = {
      enabled: process.env.SMS_ENABLED === 'true',
      provider: 'SMS8',
      senderName: process.env.SMS_SENDER_NAME || 'GS-Pipeline',
      typesEnabled: {
        ORDER_CREATED: process.env.SMS_ORDER_CREATED !== 'false',
        ORDER_VALIDATED: process.env.SMS_ORDER_VALIDATED !== 'false',
        DELIVERY_ASSIGNED: process.env.SMS_DELIVERY_ASSIGNED !== 'false',
        ORDER_DELIVERED: process.env.SMS_ORDER_DELIVERED !== 'false',
        EXPEDITION_CONFIRMED: process.env.SMS_EXPEDITION_CONFIRMED !== 'false',
        EXPRESS_ARRIVED: process.env.SMS_EXPRESS_ARRIVED !== 'false',
        EXPRESS_REMINDER: process.env.SMS_EXPRESS_REMINDER !== 'false',
        RDV_SCHEDULED: process.env.SMS_RDV_SCHEDULED !== 'false',
        RDV_REMINDER: process.env.SMS_RDV_REMINDER !== 'false',
        DELIVERER_ALERT: process.env.SMS_DELIVERER_ALERT !== 'false'
      }
    };

    res.json({
      success: true,
      config
    });
  } catch (error) {
    console.error('Erreur récupération configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la configuration.'
    });
  }
});

/**
 * POST /api/sms/send-manual - Envoyer un SMS manuel à un client
 * Permissions : ADMIN, GESTIONNAIRE, APPELANT
 */
router.post('/send-manual', authorize('ADMIN', 'GESTIONNAIRE', 'APPELANT'), async (req, res) => {
  try {
    const { orderId, phoneNumber, message } = req.body;

    // Validation
    if (!phoneNumber || !message) {
      return res.status(400).json({
        success: false,
        error: 'Numéro de téléphone et message requis.'
      });
    }

    if (message.length > 160) {
      return res.status(400).json({
        success: false,
        error: 'Le message ne doit pas dépasser 160 caractères.'
      });
    }

    // Vérifier que l'envoi SMS est activé
    if (process.env.SMS_ENABLED !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'L\'envoi de SMS est désactivé.'
      });
    }

    // Envoi du SMS
    const result = await sendSMS(phoneNumber, message, {
      type: 'NOTIFICATION',
      userId: req.user.id,
      orderId: orderId ? parseInt(orderId) : undefined
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'SMS envoyé avec succès.',
        smsLogId: result.smsLogId,
        credits: result.credits
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Erreur envoi SMS manuel:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de l\'envoi du SMS.'
    });
  }
});

export default router;
