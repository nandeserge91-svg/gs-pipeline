import axios from 'axios';
import prisma from '../config/prisma.js';
import { cleanPhoneNumber } from '../utils/phone.util.js';

const DEFAULT_API_URL = 'https://www.wasenderapi.com/api';
export const WASENDER_PROVIDER_NAME = 'WaSenderAPI';

let queueTail = Promise.resolve();
let lastRequestStartedAt = 0;

const wait = (milliseconds) => new Promise(resolve => setTimeout(resolve, milliseconds));

export function getWasenderConfiguration(env = process.env) {
  return {
    provider: WASENDER_PROVIDER_NAME,
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

function asPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function isRetryable(error) {
  const status = error.response?.status;
  const providerError = String(
    error.response?.data?.message
    || error.response?.data?.error
    || error.message
    || ''
  ).toLowerCase();

  return !error.response
    || status === 408
    || status === 429
    || status >= 500
    || providerError.includes('account protection')
    || providerError.includes('not connected')
    || providerError.includes('session is not connected');
}

function getRetryDelay(error, minimumInterval) {
  const retryAfter = error.response?.data?.retry_after
    ?? error.response?.headers?.['retry-after'];
  const retryAfterSeconds = Number.parseFloat(retryAfter);
  return Number.isFinite(retryAfterSeconds)
    ? Math.max(minimumInterval, retryAfterSeconds * 1000)
    : minimumInterval;
}

async function updateWhatsAppLog(db, id, data) {
  return db.smsLog.update({ where: { id }, data });
}

async function createWhatsAppLog(db, data) {
  return db.smsLog.create({
    data: {
      phoneNumber: data.phoneNumber,
      message: data.message,
      status: data.status,
      provider: WASENDER_PROVIDER_NAME,
      providerId: data.providerId || null,
      providerStatus: data.providerStatus || null,
      errorMessage: data.errorMessage || null,
      orderId: data.metadata.orderId || null,
      userId: data.metadata.userId || null,
      type: data.metadata.type || 'NOTIFICATION',
      credits: null,
      attempts: data.attempts || 0,
      lastAttemptAt: data.lastAttemptAt || null,
      sentAt: new Date()
    }
  });
}

async function runInQueue(task, options) {
  const scheduled = queueTail.then(async () => {
    const elapsed = options.now() - lastRequestStartedAt;
    const delay = Math.max(0, options.minimumInterval - elapsed);
    if (delay > 0) await options.sleep(delay);
    lastRequestStartedAt = options.now();
    return task();
  });

  queueTail = scheduled.catch(() => undefined);
  return scheduled;
}

export function resetWasenderQueueForTests() {
  queueTail = Promise.resolve();
  lastRequestStartedAt = 0;
}

export async function sendWhatsAppMessage(phone, message, metadata = {}, options = {}) {
  const env = options.env || process.env;
  const db = options.db || prisma;
  const httpClient = options.httpClient || axios;
  const sleep = options.sleep || wait;
  const now = options.now || Date.now;
  const config = getWasenderConfiguration(env);
  const minimumInterval = asPositiveInteger(
    options.minimumInterval ?? env.WASENDER_MIN_INTERVAL_MS,
    5500
  );
  const maxAttempts = Math.max(1, asPositiveInteger(
    options.maxAttempts ?? env.WASENDER_MAX_ATTEMPTS,
    3
  ));
  let cleanPhone = String(phone || '');
  let messageLog = null;

  if (!config.enabled) {
    return { success: true, skipped: true, reason: 'WHATSAPP_DISABLED' };
  }

  try {
    if (!config.configured) {
      throw new Error('Configuration WaSenderAPI incomplète : WASENDER_API_KEY est manquante');
    }

    cleanPhone = cleanPhoneNumber(phone);
    if (!/^\+[1-9]\d{9,14}$/.test(cleanPhone)) {
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
          provider: WASENDER_PROVIDER_NAME,
          status: { in: ['PENDING', 'SENT', 'DELIVERED', 'READ'] }
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

    messageLog = await createWhatsAppLog(db, {
      phoneNumber: cleanPhone,
      message: message.trim(),
      status: 'PENDING',
      metadata
    });

    const timeout = asPositiveInteger(env.WASENDER_TIMEOUT_MS, 15000);
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await runInQueue(async () => {
          await updateWhatsAppLog(db, messageLog.id, {
            attempts: attempt,
            lastAttemptAt: new Date()
          });

          return httpClient.post(
            `${config.apiUrl}/send-message`,
            { to: cleanPhone, text: message.trim() },
            {
              headers: {
                Authorization: `Bearer ${env.WASENDER_API_KEY.trim()}`,
                'Content-Type': 'application/json'
              },
              timeout
            }
          );
        }, { minimumInterval, sleep, now });

        const parsed = parseWasenderResponse(response.data);
        if (!parsed.isSuccess) {
          const providerResponseError = new Error(parsed.providerError);
          providerResponseError.response = { status: response.status, data: response.data };
          throw providerResponseError;
        }

        await updateWhatsAppLog(db, messageLog.id, {
          status: 'SENT',
          providerId: String(parsed.messageData.msgId),
          providerStatus: parsed.providerStatus,
          errorMessage: null
        });

        console.log(`Message WhatsApp accepté par WaSenderAPI : ${cleanPhone}`);
        return {
          success: true,
          messageLogId: messageLog.id,
          messageId: parsed.messageData.msgId,
          providerStatus: parsed.providerStatus
        };
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts && isRetryable(error)) {
          await sleep(getRetryDelay(error, minimumInterval));
          continue;
        }
        break;
      }
    }

    throw lastError || new Error('Échec WaSenderAPI');
  } catch (error) {
    const providerError = error.response?.data
      ? getProviderError(error.response.data, error.response.data?.data || {})
      : error.message;

    console.error(`Erreur envoi WhatsApp : ${providerError}`);
    try {
      if (messageLog) {
        await updateWhatsAppLog(db, messageLog.id, {
          status: 'FAILED',
          providerStatus: 'failed',
          errorMessage: providerError
        });
      } else {
        messageLog = await createWhatsAppLog(db, {
          phoneNumber: cleanPhone,
          message: typeof message === 'string' ? message : String(message || ''),
          status: 'FAILED',
          providerStatus: 'failed',
          errorMessage: providerError,
          metadata
        });
      }

      return { success: false, messageLogId: messageLog.id, error: providerError };
    } catch (logError) {
      console.error(`Erreur journal WhatsApp : ${logError.message}`);
      return { success: false, error: providerError };
    }
  }
}

export default {
  getWasenderConfiguration,
  parseWasenderResponse,
  resetWasenderQueueForTests,
  sendWhatsAppMessage
};
