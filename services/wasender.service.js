import axios from 'axios';
import prisma from '../config/prisma.js';
import { cleanPhoneNumber } from '../utils/phone.util.js';

const DEFAULT_API_URL = 'https://www.wasenderapi.com/api';
const PROVIDER_NAME = 'WaSenderAPI';

export function getWasenderConfiguration(env = process.env) {
  return {
    provider: PROVIDER_NAME,
    apiUrl: (env.WASENDER_API_URL || DEFAULT_API_URL).trim().replace(/\/+$/, ''),
    configured: Boolean(env.WASENDER_API_KEY?.trim()),
    enabled: env.WHATSAPP_ENABLED === 'true',
    sessionScoped: true
  };
}

function getProviderError(apiResponse, messageData = {}) {
  const validationErrors = apiResponse?.errors
    ? Object.values(apiResponse.errors).flat().join(' ')
    : null;

  return apiResponse?.message
    || apiResponse?.error?.message
    || apiResponse?.error
    || messageData?.message
    || validationErrors
    || `Échec WaSenderAPI (${messageData?.status || 'statut inconnu'})`;
}

export function parseWasenderResponse(apiResponse = {}) {
  const messageData = apiResponse?.data || {};
  const providerStatus = String(messageData.status || '').toLowerCase();
  const isSuccess = Boolean(
    apiResponse?.success === true
    && messageData.msgId !== undefined
    && messageData.msgId !== null
    && !['error', 'failed'].includes(providerStatus)
  );

  return {
    messageData,
    providerStatus: providerStatus || null,
    isSuccess,
    providerError: isSuccess ? null : getProviderError(apiResponse, messageData)
  };
}

async function createWhatsAppLog(db, data) {
  return db.smsLog.create({
    data: {
      phoneNumber: data.phoneNumber,
      message: data.message,
      status: data.status,
      provider: PROVIDER_NAME,
      providerId: data.providerId || null,
      errorMessage: data.errorMessage || null,
      orderId: data.metadata.orderId || null,
      userId: data.metadata.userId || null,
      type: data.metadata.type || 'NOTIFICATION',
      credits: null,
      sentAt: new Date()
    }
  });
}

export async function sendWhatsAppMessage(phone, message, metadata = {}, options = {}) {
  const env = options.env || process.env;
  const db = options.db || prisma;
  const httpClient = options.httpClient || axios;
  const config = getWasenderConfiguration(env);
  let cleanPhone = String(phone || '');

  if (!config.enabled) {
    return { success: true, skipped: true, reason: 'WHATSAPP_DISABLED' };
  }

  try {
    if (!config.configured) {
      throw new Error('Configuration WaSenderAPI incomplète : WASENDER_API_KEY est manquante');
    }

    cleanPhone = cleanPhoneNumber(phone);
    if (!cleanPhone) {
      throw new Error('Numéro de téléphone invalide');
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new Error('Message WhatsApp vide');
    }

    const messageType = metadata.type || 'NOTIFICATION';
    if (metadata.orderId && messageType.startsWith('MARKETING_RELANCE_J')) {
      const existingLog = await db.smsLog.findFirst({
        where: {
          orderId: metadata.orderId,
          type: messageType,
          provider: PROVIDER_NAME,
          status: 'SENT'
        },
        select: { id: true, providerId: true }
      });

      if (existingLog) {
        return {
          success: true,
          skipped: true,
          reason: 'ALREADY_SENT',
          messageLogId: existingLog.id,
          messageId: existingLog.providerId
        };
      }
    }

    const timeout = Number.parseInt(env.WASENDER_TIMEOUT_MS || '15000', 10);
    const response = await httpClient.post(
      `${config.apiUrl}/send-message`,
      { to: cleanPhone, text: message.trim() },
      {
        headers: {
          Authorization: `Bearer ${env.WASENDER_API_KEY.trim()}`,
          'Content-Type': 'application/json'
        },
        timeout: Number.isFinite(timeout) ? timeout : 15000
      }
    );

    const parsed = parseWasenderResponse(response.data);
    const messageLog = await createWhatsAppLog(db, {
      phoneNumber: cleanPhone,
      message: message.trim(),
      status: parsed.isSuccess ? 'SENT' : 'FAILED',
      providerId: parsed.messageData.msgId !== undefined
        ? String(parsed.messageData.msgId)
        : null,
      errorMessage: parsed.providerError,
      metadata
    });

    if (!parsed.isSuccess) {
      return {
        success: false,
        messageLogId: messageLog.id,
        error: parsed.providerError,
        providerStatus: parsed.providerStatus
      };
    }

    console.log(`💬 Message WhatsApp accepté par WaSenderAPI : ${cleanPhone}`);
    return {
      success: true,
      messageLogId: messageLog.id,
      messageId: parsed.messageData.msgId,
      providerStatus: parsed.providerStatus
    };
  } catch (error) {
    const providerError = error.response?.data
      ? getProviderError(error.response.data, error.response.data?.data || {})
      : error.message;

    console.error(`❌ Erreur envoi WhatsApp : ${providerError}`);
    try {
      const messageLog = await createWhatsAppLog(db, {
        phoneNumber: cleanPhone,
        message: typeof message === 'string' ? message : String(message || ''),
        status: 'FAILED',
        errorMessage: providerError,
        metadata
      });

      return { success: false, messageLogId: messageLog.id, error: providerError };
    } catch (logError) {
      console.error(`❌ Erreur journal WhatsApp : ${logError.message}`);
      return { success: false, error: providerError };
    }
  }
}

export default {
  getWasenderConfiguration,
  parseWasenderResponse,
  sendWhatsAppMessage
};
