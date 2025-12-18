/**
 * 📱 SERVICE SMS8.io - Envoi de SMS automatiques
 * 
 * Ce service gère l'envoi de SMS via SMS8.io pour :
 * - Notifications clients (commandes, livraisons, RDV)
 * - Alertes internes (livreurs, appelants)
 * - Confirmations de paiement
 * 
 * Documentation API : https://app.sms8.io/
 */

import axios from 'axios';
import prisma from '../config/prisma.js';
import { cleanPhoneNumber } from '../utils/phone.util.js';

// Configuration SMS8.io
const SMS8_API_KEY = process.env.SMS8_API_KEY || '6a854258b60b92bd3a87ee563ac8a375ed28a78f';
const SMS8_API_URL = process.env.SMS8_API_URL || 'https://app.sms8.io/services/sendFront.php';
const SMS_SENDER_NAME = process.env.SMS_SENDER_NAME || 'GS-Pipeline';

/**
 * 📤 Fonction principale d'envoi de SMS
 * @param {string} phone - Numéro de téléphone (format : +225XXXXXXXXXX ou 225XXXXXXXXXX)
 * @param {string} message - Message à envoyer (max 160 caractères standard)
 * @param {object} metadata - Métadonnées optionnelles (orderId, type, userId)
 * @returns {Promise<object>} - Résultat de l'envoi
 */
export async function sendSMS(phone, message, metadata = {}) {
  try {
    // Validation du numéro de téléphone
    const cleanPhone = cleanPhoneNumber(phone);
    if (!cleanPhone) {
      throw new Error('Numéro de téléphone invalide');
    }

    // Validation du message
    if (!message || message.trim().length === 0) {
      throw new Error('Message vide');
    }

    // Envoi du SMS via SMS8.io
    const response = await axios.get(SMS8_API_URL, {
      params: {
        key: SMS8_API_KEY,
        to: cleanPhone,
        message: message,
        sender: SMS_SENDER_NAME
      },
      timeout: 10000 // 10 secondes
    });

    // Log du SMS en base de données
    const smsLog = await prisma.smsLog.create({
      data: {
        phoneNumber: cleanPhone,
        message: message,
        status: response.data.success ? 'SENT' : 'FAILED',
        provider: 'SMS8',
        providerId: response.data.data?.messageId || null,
        errorMessage: response.data.error || null,
        orderId: metadata.orderId || null,
        userId: metadata.userId || null,
        type: metadata.type || 'NOTIFICATION',
        credits: response.data.data?.credits || null,
        sentAt: new Date()
      }
    });

    return {
      success: true,
      smsLogId: smsLog.id,
      messageId: response.data.data?.messageId,
      credits: response.data.data?.credits,
      message: 'SMS envoyé avec succès'
    };

  } catch (error) {
    console.error('❌ Erreur envoi SMS:', error.message);

    // Log de l'erreur en base de données
    try {
      await prisma.smsLog.create({
        data: {
          phoneNumber: phone,
          message: message,
          status: 'FAILED',
          provider: 'SMS8',
          errorMessage: error.message,
          orderId: metadata.orderId || null,
          userId: metadata.userId || null,
          type: metadata.type || 'NOTIFICATION',
          sentAt: new Date()
        }
      });
    } catch (logError) {
      console.error('❌ Erreur log SMS:', logError.message);
    }

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 📋 TEMPLATES DE MESSAGES SMS
 * 
 * Tous les messages sont limités à 160 caractères pour un SMS standard
 * Les accents sont conservés (supportés par SMS8.io)
 */
export const smsTemplates = {
  
  /**
   * 🆕 Commande créée (NOUVELLE)
   */
  orderCreated: (clientNom, orderReference) => {
    const prenom = clientNom.split(' ')[0]; // Premier prénom seulement
    return `Bonjour ${prenom}, votre commande ${orderReference} est enregistree. Nous vous appellerons bientot. - ${SMS_SENDER_NAME}`;
  },

  /**
   * ✅ Commande validée
   */
  orderValidated: (clientNom, produitNom, montant) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, votre commande ${produitNom} (${montant} F) est confirmee. Livraison prochainement. - ${SMS_SENDER_NAME}`;
  },

  /**
   * 🚚 Livreur en route
   */
  deliveryAssigned: (clientNom, livreurNom, telephone) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, votre livreur ${livreurNom} (${telephone}) est en route. - ${SMS_SENDER_NAME}`;
  },

  /**
   * ✅ Commande livrée
   */
  orderDelivered: (clientNom, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, votre commande ${orderReference} a ete livree avec succes. Merci de votre confiance ! - ${SMS_SENDER_NAME}`;
  },

  /**
   * 📦 EXPEDITION - Confirmation expédition (100%)
   */
  expeditionConfirmed: (clientNom, codeExpedition, ville) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, votre colis a ete expedie vers ${ville}. Code suivi: ${codeExpedition}. - ${SMS_SENDER_NAME}`;
  },

  /**
   * 🏢 EXPRESS - Arrivé en agence (avec code)
   */
  expressArrived: (clientNom, agence, codeExpedition, montantRestant) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, votre colis est arrive a ${agence}. Code retrait: ${codeExpedition}. A payer: ${montantRestant} F. - ${SMS_SENDER_NAME}`;
  },

  /**
   * 🏢 EXPRESS - Rappel retrait (si client tarde)
   */
  expressReminder: (clientNom, agence, codeExpedition, joursAttente) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, votre colis vous attend a ${agence} depuis ${joursAttente} jours. Code: ${codeExpedition}. - ${SMS_SENDER_NAME}`;
  },

  /**
   * 📅 RDV - Programmation
   */
  rdvScheduled: (clientNom, rdvDate, rdvHeure) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, RDV programme le ${rdvDate} a ${rdvHeure}. Merci de rester disponible. - ${SMS_SENDER_NAME}`;
  },

  /**
   * 📅 RDV - Rappel (1h avant)
   */
  rdvReminder: (clientNom, rdvHeure) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, rappel de votre RDV a ${rdvHeure}. Nous vous appellerons bientot. - ${SMS_SENDER_NAME}`;
  },

  /**
   * ❌ Commande annulée
   */
  orderCancelled: (clientNom, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, votre commande ${orderReference} a ete annulee comme demande. - ${SMS_SENDER_NAME}`;
  },

  /**
   * 💰 Confirmation paiement EXPEDITION
   */
  paymentConfirmed: (clientNom, montant, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return `Bonjour ${prenom}, paiement de ${montant} F recu pour la commande ${orderReference}. Merci ! - ${SMS_SENDER_NAME}`;
  },

  /**
   * 🔔 Alerte livreur - Nouvelle livraison
   */
  delivererNewDelivery: (livreurNom, nombreCommandes, zone) => {
    const prenom = livreurNom.split(' ')[0];
    return `Bonjour ${prenom}, vous avez ${nombreCommandes} nouvelle(s) livraison(s) assignee(s) pour ${zone}. - ${SMS_SENDER_NAME}`;
  },

  /**
   * 📊 Alerte appelant - Objectif atteint
   */
  callerGoalReached: (appelantNom, nombreValidees, objectif) => {
    const prenom = appelantNom.split(' ')[0];
    return `Bravo ${prenom} ! Vous avez valide ${nombreValidees}/${objectif} commandes aujourd'hui. Excellent travail ! - ${SMS_SENDER_NAME}`;
  },

  /**
   * 🎉 Message de bienvenue nouvel utilisateur
   */
  welcomeUser: (userNom, userRole) => {
    const prenom = userNom.split(' ')[0];
    const roleLabel = {
      ADMIN: 'Administrateur',
      GESTIONNAIRE: 'Gestionnaire',
      APPELANT: 'Appelant',
      LIVREUR: 'Livreur',
      GESTIONNAIRE_STOCK: 'Gestionnaire Stock'
    }[userRole] || userRole;
    return `Bienvenue ${prenom} ! Votre compte ${roleLabel} a ete cree sur ${SMS_SENDER_NAME}. Bon travail !`;
  }
};

/**
 * 🔢 Obtenir le solde de crédits SMS
 * @returns {Promise<object>} - Solde et informations
 */
export async function getSMSCredits() {
  try {
    const response = await axios.get(SMS8_API_URL, {
      params: {
        key: SMS8_API_KEY
      },
      timeout: 5000
    });

    return {
      success: true,
      credits: response.data.data?.credits || 'N/A',
      message: 'Crédits récupérés avec succès'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 📊 Statistiques SMS
 * @param {number} days - Nombre de jours à analyser (par défaut 30)
 * @returns {Promise<object>} - Statistiques
 */
export async function getSMSStats(days = 30) {
  try {
    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const stats = await prisma.smsLog.groupBy({
      by: ['status'],
      where: {
        sentAt: {
          gte: dateLimit
        }
      },
      _count: true
    });

    const total = stats.reduce((sum, s) => sum + s._count, 0);
    const sent = stats.find(s => s.status === 'SENT')?._count || 0;
    const failed = stats.find(s => s.status === 'FAILED')?._count || 0;

    return {
      success: true,
      period: `${days} derniers jours`,
      total,
      sent,
      failed,
      successRate: total > 0 ? ((sent / total) * 100).toFixed(2) + '%' : '0%'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 📜 Historique des SMS
 * @param {object} filters - Filtres (orderId, userId, status, type, limit)
 * @returns {Promise<Array>} - Liste des SMS
 */
export async function getSMSHistory(filters = {}) {
  try {
    const where = {};
    
    if (filters.orderId) where.orderId = parseInt(filters.orderId);
    if (filters.userId) where.userId = parseInt(filters.userId);
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = filters.type;
    
    if (filters.startDate || filters.endDate) {
      where.sentAt = {};
      if (filters.startDate) where.sentAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.sentAt.lte = new Date(filters.endDate);
    }

    const logs = await prisma.smsLog.findMany({
      where,
      orderBy: { sentAt: 'desc' },
      take: filters.limit || 100,
      include: {
        order: {
          select: {
            orderReference: true,
            clientNom: true
          }
        },
        user: {
          select: {
            nom: true,
            prenom: true
          }
        }
      }
    });

    return {
      success: true,
      logs,
      count: logs.length
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ⏰ Fonction pour envoyer des SMS programmés (job cron)
 * - Rappels RDV
 * - Rappels EXPRESS non retirés
 */
export async function sendScheduledSMS() {
  try {
    let totalSent = 0;

    // 1. Rappels RDV (1h avant)
    const now = new Date();
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

    const rdvToRemind = await prisma.order.findMany({
      where: {
        rdvProgramme: true,
        rdvRappele: false,
        rdvDate: {
          gte: now,
          lte: oneHourLater
        }
      }
    });

    for (const order of rdvToRemind) {
      const rdvHeure = new Date(order.rdvDate).toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      
      const message = smsTemplates.rdvReminder(order.clientNom, rdvHeure);
      const result = await sendSMS(order.clientTelephone, message, {
        orderId: order.id,
        type: 'RDV_REMINDER'
      });

      if (result.success) {
        // Marquer comme rappelé
        await prisma.order.update({
          where: { id: order.id },
          data: { rdvRappele: true }
        });
        totalSent++;
      }
    }

    // 2. Rappels EXPRESS non retirés (après 3 jours)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const expressToRemind = await prisma.order.findMany({
      where: {
        status: 'EXPRESS_ARRIVE',
        arriveAt: {
          lte: threeDaysAgo
        },
        // Vérifier qu'on n'a pas déjà envoyé de rappel aujourd'hui
        NOT: {
          smsLogs: {
            some: {
              type: 'EXPRESS_REMINDER',
              sentAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          }
        }
      },
      include: {
        smsLogs: true
      }
    });

    for (const order of expressToRemind) {
      const joursAttente = Math.floor(
        (now - new Date(order.arriveAt)) / (1000 * 60 * 60 * 24)
      );

      const message = smsTemplates.expressReminder(
        order.clientNom,
        order.agenceRetrait || 'notre agence',
        order.codeExpedition,
        joursAttente
      );

      const result = await sendSMS(order.clientTelephone, message, {
        orderId: order.id,
        type: 'EXPRESS_REMINDER'
      });

      if (result.success) totalSent++;
    }

    console.log(`✅ ${totalSent} SMS programmés envoyés`);
    
    return {
      success: true,
      sent: totalSent
    };

  } catch (error) {
    console.error('❌ Erreur SMS programmés:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  sendSMS,
  smsTemplates,
  getSMSCredits,
  getSMSStats,
  getSMSHistory,
  sendScheduledSMS
};
