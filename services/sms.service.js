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
const SMS8_API_URL = process.env.SMS8_API_URL || 'https://app.sms8.io/services/send.php';
const SMS_DEVICE_ID = process.env.SMS_DEVICE_ID?.trim();
const SMS_SIM_SLOT = process.env.SMS_SIM_SLOT?.trim() || '0'; // SIM 1 (index 0)
const CONFIGURED_SMS8_API_KEY = process.env.SMS8_API_KEY?.trim();

export function buildSmsDeviceParam(deviceId, simSlot = '0') {
  const normalizedDeviceId = String(deviceId || '').trim();
  const normalizedSimSlot = String(simSlot).trim();

  if (!normalizedDeviceId) {
    throw new Error('Configuration SMS8 incomplète : SMS_DEVICE_ID est manquant');
  }

  if (!['0', '1'].includes(normalizedSimSlot)) {
    throw new Error('Configuration SMS8 invalide : SMS_SIM_SLOT doit être 0 (SIM 1) ou 1 (SIM 2)');
  }

  // SMS8 sélectionne la carte par son emplacement physique, jamais par son numéro.
  return `${normalizedDeviceId}|${normalizedSimSlot}`;
}

function getSms8ErrorMessage(apiResponse, messageData) {
  return apiResponse?.error?.message
    || messageData?.error?.message
    || messageData?.error
    || apiResponse?.message
    || messageData?.message
    || `Échec SMS8 (${messageData?.status || 'statut inconnu'})`;
}

export function parseSms8Response(apiResponse = {}) {
  const messageData = apiResponse.data?.messages?.[0] || {};
  const providerStatus = String(messageData.status || '').toLowerCase();
  const isSuccess = Boolean(
    apiResponse.success
    && apiResponse.data?.messages?.length > 0
    && providerStatus !== 'failed'
    && providerStatus !== 'error'
  );

  return {
    messageData,
    isSuccess,
    providerError: isSuccess ? null : getSms8ErrorMessage(apiResponse, messageData)
  };
}

/**
 * 📋 Charger un template SMS depuis la base de données
 * @param {string} templateKey - Clé du template (ORDER_CREATED, ORDER_VALIDATED, etc.)
 * @returns {Promise<object|null>} - Template ou null si non trouvé
 */
export async function getTemplate(templateKey) {
  try {
    // Vérifier si la table existe
    const template = await prisma.smsTemplate.findUnique({
      where: { key: templateKey }
    });
    return template;
  } catch (error) {
    // Si la table n'existe pas (migration pas exécutée), utiliser fallback
    if (error.code === 'P2021' || error.message.includes('does not exist')) {
      console.warn(`⚠️ Table sms_templates n'existe pas encore, utilisation fallback`);
      return null;
    }
    console.error(`❌ Erreur chargement template ${templateKey}:`, error.message);
    return null;
  }
}

/**
 * 🔄 Remplacer les variables dans un template
 * @param {string} template - Template avec variables {prenom}, {ref}, etc.
 * @param {object} variables - Objet avec les valeurs {prenom: 'John', ref: '123'}
 * @returns {string} - Template avec variables remplacées
 */
function replaceVariables(template, variables) {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{${key}\\}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

/**
 * 📤 Fonction principale d'envoi de SMS
 * @param {string} phone - Numéro de téléphone (format : +225XXXXXXXXXX ou 225XXXXXXXXXX)
 * @param {string} message - Message à envoyer (max 160 caractères standard)
 * @param {object} metadata - Métadonnées optionnelles (orderId, type, userId)
 * @returns {Promise<object>} - Résultat de l'envoi
 */
export async function sendSMS(phone, message, metadata = {}) {
  try {
    if (!CONFIGURED_SMS8_API_KEY) {
      throw new Error('Configuration SMS8 incomplète : SMS8_API_KEY est manquante');
    }

    // Validation du numéro de téléphone
    const cleanPhone = cleanPhoneNumber(phone);
    if (!cleanPhone) {
      throw new Error('Numéro de téléphone invalide');
    }

    // Validation du message
    if (!message || message.trim().length === 0) {
      throw new Error('Message vide');
    }

    // Envoi via l'emplacement SIM physique. "deviceID|0" = SIM 1.
    // Si le téléphone ne contient qu'une carte dans SIM 1, cette carte est utilisée
    // quel que soit son numéro de téléphone.
    const deviceParam = buildSmsDeviceParam(SMS_DEVICE_ID, SMS_SIM_SLOT);
    
    const response = await axios.post(SMS8_API_URL, null, {
      params: {
        key: CONFIGURED_SMS8_API_KEY,
        number: cleanPhone,
        message: message,
        devices: deviceParam,
        prioritize: metadata.prioritize ? 1 : 0
      },
      timeout: 15000 // 15 secondes
    });

    // Parser la réponse de l'API send.php
    const apiResponse = response.data;
    const { messageData, isSuccess, providerError } = parseSms8Response(apiResponse);
    
    // Log du SMS en base de données
    const smsLog = await prisma.smsLog.create({
      data: {
        phoneNumber: cleanPhone,
        message: message,
        status: isSuccess && messageData.status !== 'Failed' ? 'SENT' : 'FAILED',
        provider: `SMS8-Device-${SMS_DEVICE_ID}`,
        providerId: messageData.ID ? String(messageData.ID) : null, // Convertir en String
        errorMessage: providerError,
        orderId: metadata.orderId || null,
        userId: metadata.userId || null,
        type: metadata.type || 'NOTIFICATION',
        credits: null, // L'API device ne retourne pas les crédits
        sentAt: new Date()
      }
    });

    if (!isSuccess) {
      console.error(`❌ Échec SMS8 pour ${cleanPhone}: ${providerError}`);
      return {
        success: false,
        smsLogId: smsLog.id,
        error: providerError,
        providerStatus: messageData.status || null,
        deviceId: SMS_DEVICE_ID,
        simSlot: SMS_SIM_SLOT
      };
    }

    console.log(`📱 SMS envoyé via Android ${SMS_DEVICE_ID} (SIM ${parseInt(SMS_SIM_SLOT) + 1}) : ${cleanPhone}`);

    return {
      success: true,
      smsLogId: smsLog.id,
      messageId: messageData.ID,
      deviceId: SMS_DEVICE_ID,
      simSlot: SMS_SIM_SLOT,
      message: 'SMS envoyé via Android dédié avec succès'
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
 * 📋 Générer un message SMS depuis un template de la DB
 * @param {string} templateKey - Clé du template (ORDER_CREATED, etc.)
 * @param {object} variables - Variables à remplacer {prenom: 'John', ref: '123', ...}
 * @returns {Promise<string>} - Message généré
 */
export async function generateSmsFromTemplate(templateKey, variables, customTemplate = null) {
  try {
    // Les relances marketing peuvent fournir un texte propre au produit.
    // Dans ce cas, ne jamais consulter le template global de la base.
    if (typeof customTemplate === 'string' && customTemplate.trim()) {
      return replaceVariables(customTemplate.trim(), variables);
    }

    // Charger le template depuis la DB
    const template = await getTemplate(templateKey);
    
    if (!template || !template.isActive) {
      console.warn(`⚠️ Template ${templateKey} non trouvé ou désactivé, utilisation du fallback`);
      return generateFallbackMessage(templateKey, variables);
    }
    
    // Remplacer les variables dans le template
    const message = replaceVariables(template.template, variables);
    
    return message;
    
  } catch (error) {
    console.error(`❌ Erreur génération SMS ${templateKey}:`, error.message);
    return generateFallbackMessage(templateKey, variables);
  }
}

/**
 * 🆘 Messages de fallback en cas d'erreur de chargement
 */
function generateFallbackMessage(templateKey, variables) {
  const fallbacks = {
    ORDER_CREATED: `Bonjour ${variables.prenom}, votre commande ${variables.ref} est enregistree. - AFGestion`,
    ORDER_VALIDATED: `Bonjour ${variables.prenom}, votre commande ${variables.produit} (${variables.montant} F) est confirmee. - AFGestion`,
    DELIVERY_ASSIGNED: `Bonjour ${variables.prenom}, votre colis a ete confie au livreur ${variables.livreur}. Il est en route vers vous. Contact: ${variables.telephone}. - AFGestion`,
    ORDER_DELIVERED: `Bonjour ${variables.prenom}, votre commande ${variables.ref} a ete livree avec succes. - AFGestion`,
    EXPEDITION_CONFIRMED: `Bonjour ${variables.prenom}, votre colis a ete expedie vers ${variables.ville}. Code: ${variables.code}. - AFGestion`,
    EXPRESS_ARRIVED: `Bonjour ${variables.prenom}, votre colis est arrive a ${variables.agence}. Code: ${variables.code}. A payer: ${variables.montant} F. - AFGestion`,
    EXPRESS_REMINDER: `Bonjour ${variables.prenom}, votre colis vous attend a ${variables.agence} depuis ${variables.jours} jours. Code: ${variables.code}. - AFGestion`,
    RDV_SCHEDULED: `Bonjour ${variables.prenom}, RDV programme le ${variables.date} a ${variables.heure}. - AFGestion`,
    RDV_REMINDER: `Bonjour ${variables.prenom}, rappel de votre RDV a ${variables.heure}. - AFGestion`,
    ORDER_CANCELLED: `Bonjour ${variables.prenom}, votre commande ${variables.ref} a ete annulee. - AFGestion`,
    PAYMENT_CONFIRMED: `Bonjour ${variables.prenom}, paiement de ${variables.montant} F recu pour ${variables.ref}. - AFGestion`,
    MARKETING_RELANCE_J3: `Bonjour ${variables.prenom}, ${variables.produit} est toujours disponible. Voir l'offre : ${variables.lien} - AFGestion`,
    MARKETING_RELANCE_J5: `Bonjour ${variables.prenom}, profitez toujours de ${variables.produit}. Commandez ici : ${variables.lien} - AFGestion`,
    MARKETING_RELANCE_J7: `Bonjour ${variables.prenom}, derniere relance pour ${variables.produit}. Offre ici : ${variables.lien} - AFGestion`,
  };
  
  return fallbacks[templateKey] || `Notification de AFGestion`;
}

/**
 * 📋 TEMPLATES DE MESSAGES SMS
 * 
 * Ces fonctions chargent maintenant les templates depuis la base de données
 * et permettent leur personnalisation via l'interface admin
 */
export const smsTemplates = {
  
  /**
   * 🆕 Commande créée (NOUVELLE)
   */
  orderCreated: async (clientNom, orderReference, produitNom) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_CREATED', { 
      prenom, 
      ref: orderReference,
      produit: produitNom 
    });
  },

  /**
   * ✅ Commande validée
   */
  orderValidated: async (clientNom, produitNom, montant) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_VALIDATED', { prenom, produit: produitNom, montant });
  },

  /**
   * 🚚 Livreur en route
   */
  deliveryAssigned: async (clientNom, livreurNom, telephone) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('DELIVERY_ASSIGNED', { prenom, livreur: livreurNom, telephone });
  },

  /**
   * ✅ Commande livrée
   */
  orderDelivered: async (clientNom, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_DELIVERED', { prenom, ref: orderReference });
  },

  /**
   * 📦 EXPEDITION - Confirmation expédition (100%)
   */
  expeditionConfirmed: async (clientNom, codeExpedition, ville) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('EXPEDITION_CONFIRMED', { prenom, code: codeExpedition, ville });
  },

  /**
   * 🏢 EXPRESS - Arrivé en agence (avec code)
   */
  expressArrived: async (clientNom, agence, codeExpedition, montantRestant) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('EXPRESS_ARRIVED', { prenom, agence, code: codeExpedition, montant: montantRestant });
  },

  /**
   * 🏢 EXPRESS - Rappel retrait (si client tarde)
   */
  expressReminder: async (clientNom, agence, codeExpedition, joursAttente) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('EXPRESS_REMINDER', { prenom, agence, code: codeExpedition, jours: joursAttente });
  },

  /**
   * 📅 RDV - Programmation
   */
  rdvScheduled: async (clientNom, rdvDate, rdvHeure) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('RDV_SCHEDULED', { prenom, date: rdvDate, heure: rdvHeure });
  },

  /**
   * 📅 RDV - Rappel (1h avant)
   */
  rdvReminder: async (clientNom, rdvHeure) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('RDV_REMINDER', { prenom, heure: rdvHeure });
  },

  /**
   * ❌ Commande annulée
   */
  orderCancelled: async (clientNom, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('ORDER_CANCELLED', { prenom, ref: orderReference });
  },

  /**
   * 📣 Relance marketing après annulation par un appelant
   */
  marketingRelaunch: async (clientNom, produitNom, marketingFunnelUrl, dayOffset) => {
    const prenom = clientNom.split(' ')[0];
    const templateKey = `MARKETING_RELANCE_J${dayOffset}`;
    return await generateSmsFromTemplate(templateKey, {
      prenom,
      produit: produitNom,
      lien: marketingFunnelUrl
    });
  },

  /**
   * 💰 Confirmation paiement EXPEDITION
   */
  paymentConfirmed: async (clientNom, montant, orderReference) => {
    const prenom = clientNom.split(' ')[0];
    return await generateSmsFromTemplate('PAYMENT_CONFIRMED', { prenom, montant, ref: orderReference });
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
        key: CONFIGURED_SMS8_API_KEY
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
