/**
 * 📱 SMSEnvoie (https://smsenvoie.com) — passerelle SMS via téléphone Android.
 *
 * Documentation : https://smsenvoie.com/docs/api
 * - POST /api/v1/sms      : envoi (to, message, device_id, sim_slot, priority, name)
 * - GET  /api/v1/devices  : téléphones connectés (id, name, online)
 * - GET  /api/v1/quota    : consommation du mois
 *
 * L'API limite à 10 requêtes par minute (HTTP 429 au-delà) et 1 000 SMS par heure.
 * Les SMS sont donc d'abord enregistrés en base (SmsLog, statut PENDING,
 * fournisseur « SMSEnvoie »), puis envoyés un par un et espacés par une file
 * d'envoi. Une commande ou une assignation n'attend jamais l'API SMS, et aucun
 * SMS n'est perdu si l'API refuse temporairement (quota, réseau, redémarrage).
 *
 * Le téléphone est choisi par son nom dans SMSEnvoie (SMSENVOIE_DEVICE_NAME,
 * « Xiaomi1 » par défaut) ou directement par son identifiant (SMSENVOIE_DEVICE_ID).
 */

import { cleanPhoneNumber } from '../utils/phone.util.js';

export const SMSENVOIE_PROVIDER_NAME = 'SMSEnvoie';
export const SMSENVOIE_DEFAULT_API_URL = 'https://smsenvoie.com/api/v1';
export const SMSENVOIE_DEFAULT_DEVICE_NAME = 'Xiaomi1';
export const SMSENVOIE_MAX_ATTEMPTS = 6;

const DEFAULT_MIN_INTERVAL_MS = 7000; // ≈ 8,5 requêtes/min, sous la limite de 10/min
const DEFAULT_TIMEOUT_MS = 15000;
const DEFAULT_MAX_AGE_MINUTES = 12 * 60;
const DEVICE_CACHE_TTL_MS = 10 * 60 * 1000;
const RATE_LIMIT_PAUSE_MS = 60 * 1000;
const ACCOUNT_ERROR_PAUSE_MS = 5 * 60 * 1000;
const TRANSIENT_ERROR_PAUSE_MS = 30 * 1000;
const OUTBOX_POLL_INTERVAL_MS = 30 * 1000;
const OUTBOX_BATCH_SIZE = 50;
const MAX_MESSAGES_PER_DRAIN = 200;

const MINUTE_MS = 60 * 1000;

/* ------------------------------------------------------------------ */
/*  Configuration                                                      */
/* ------------------------------------------------------------------ */

function parseInteger(value, fallback) {
  const parsed = Number.parseInt(String(value ?? '').trim(), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Emplacement SIM : 0 = SIM 1, 1 = SIM 2, vide = choix automatique SMSEnvoie.
 * Retourne undefined si la valeur est invalide.
 */
export function parseSmsEnvoieSimSlot(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  if (raw === '0' || raw === '1') return Number(raw);
  return undefined;
}

export function getSmsEnvoieConfiguration(env = process.env) {
  const simSlot = parseSmsEnvoieSimSlot(env.SMSENVOIE_SIM_SLOT);
  const deviceId = String(env.SMSENVOIE_DEVICE_ID || '').trim();

  return {
    apiKey: String(env.SMSENVOIE_API_KEY || '').trim(),
    apiUrl: String(env.SMSENVOIE_API_URL || SMSENVOIE_DEFAULT_API_URL).trim().replace(/\/+$/, ''),
    deviceId,
    deviceName: String(env.SMSENVOIE_DEVICE_NAME || '').trim() || SMSENVOIE_DEFAULT_DEVICE_NAME,
    simSlot: simSlot === undefined ? null : simSlot,
    simSlotInvalid: simSlot === undefined,
    minIntervalMs: Math.max(6000, parseInteger(env.SMSENVOIE_MIN_INTERVAL_MS, DEFAULT_MIN_INTERVAL_MS)),
    timeoutMs: Math.max(1000, parseInteger(env.SMSENVOIE_TIMEOUT_MS, DEFAULT_TIMEOUT_MS)),
    maxAgeMs: Math.max(10, parseInteger(env.SMSENVOIE_MAX_AGE_MINUTES, DEFAULT_MAX_AGE_MINUTES)) * MINUTE_MS
  };
}

export function isSmsEnvoieConfigured(env = process.env) {
  return Boolean(getSmsEnvoieConfiguration(env).apiKey);
}

/**
 * Informations affichables dans l'administration (jamais la clé API).
 */
export function getSmsEnvoiePublicConfiguration(env = process.env) {
  const config = getSmsEnvoieConfiguration(env);
  return {
    provider: 'SMSENVOIE',
    providerLabel: 'SMSEnvoie',
    configured: Boolean(config.apiKey),
    deviceName: config.deviceId ? null : config.deviceName,
    deviceId: config.deviceId || null,
    simSlot: config.simSlot === null ? null : String(config.simSlot),
    simLabel: config.simSlot === null ? 'Automatique' : `SIM ${config.simSlot + 1}`,
    simSlotInvalid: config.simSlotInvalid,
    maxPerMinute: Math.floor(60000 / config.minIntervalMs)
  };
}

/* ------------------------------------------------------------------ */
/*  Erreurs et réponses                                                */
/* ------------------------------------------------------------------ */

/**
 * kind :
 *  - rate_limited : limite de 10 requêtes/minute atteinte → on réessaie plus tard
 *  - account      : clé invalide, quota épuisé, téléphone introuvable → pause de la file
 *  - permanent    : message ou numéro refusé → échec définitif du SMS
 *  - transient    : réseau, délai dépassé, erreur serveur → nouvelle tentative
 */
export class SmsEnvoieError extends Error {
  constructor(message, { kind = 'transient', code = null, httpStatus = null } = {}) {
    super(message);
    this.name = 'SmsEnvoieError';
    this.kind = kind;
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const ACCOUNT_ERROR_CODES = new Set(['invalid_api_key', 'unauthorized', 'forbidden', 'quota_exceeded', 'not_found', 'device_not_found']);
const PERMANENT_ERROR_CODES = new Set(['missing_to', 'missing_message', 'invalid_to', 'invalid_phone', 'invalid_message', 'bad_request', 'skipped_optout']);

export function classifySmsEnvoieFailure(httpStatus, code) {
  const normalizedCode = String(code || '').toLowerCase();
  if (httpStatus === 429 || normalizedCode === 'rate_limited') return 'rate_limited';
  if (httpStatus === 401 || httpStatus === 403 || httpStatus === 404 || ACCOUNT_ERROR_CODES.has(normalizedCode)) return 'account';
  if ((httpStatus >= 400 && httpStatus < 500) || PERMANENT_ERROR_CODES.has(normalizedCode)) return 'permanent';
  return 'transient';
}

/**
 * Interprète la réponse de POST /api/v1/sms.
 * Exemple : { ok: true, campaign_id, total: 1, skipped_optout: 0, invalid: 0, status: 'queued' }
 */
export function parseSmsEnvoieSendResponse(payload = {}) {
  const ok = payload?.ok === true;
  const total = Number(payload?.total ?? 0);
  const invalid = Number(payload?.invalid ?? 0);
  const skippedOptout = Number(payload?.skipped_optout ?? 0);

  let error = null;
  let code = null;
  if (!ok) {
    error = String(payload?.error || 'SMSEnvoie a refusé la requête');
    code = String(payload?.code || 'smsenvoie_error');
  } else if (Number.isFinite(total) && total === 0 && (invalid > 0 || skippedOptout > 0)) {
    error = skippedOptout > 0
      ? 'Client désinscrit des SMS (STOP) : SMS non envoyé'
      : 'Numéro refusé par SMSEnvoie (invalide)';
    code = skippedOptout > 0 ? 'skipped_optout' : 'invalid_to';
  }

  return {
    success: ok && !error,
    campaignId: payload?.campaign_id ? String(payload.campaign_id) : null,
    status: payload?.status ? String(payload.status).toLowerCase() : null,
    total,
    invalid,
    skippedOptout,
    error,
    code
  };
}

function normalizeDeviceName(value) {
  return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Choisit le téléphone par son nom (« Xiaomi1 », « xiaomi 1 »…).
 */
export function findSmsEnvoieDevice(devices = [], wantedName) {
  const list = Array.isArray(devices) ? devices : [];
  const exact = list.filter(
    (device) => String(device?.name || '').trim().toLowerCase() === String(wantedName || '').trim().toLowerCase()
  );
  const candidates = exact.length > 0
    ? exact
    : list.filter((device) => normalizeDeviceName(device?.name) === normalizeDeviceName(wantedName));

  if (candidates.length === 0) return null;
  return candidates.find((device) => device?.online) || candidates[0];
}

export function isMarketingSmsType(type) {
  return String(type || '').startsWith('MARKETING_');
}

/* ------------------------------------------------------------------ */
/*  Client HTTP limité (≤ 10 requêtes/minute)                          */
/* ------------------------------------------------------------------ */

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const limiterState = { tail: Promise.resolve(), lastStartedAt: 0 };

function scheduleRequest(task, { minIntervalMs, now, sleep }) {
  const run = limiterState.tail.then(async () => {
    const delay = Math.max(0, limiterState.lastStartedAt + minIntervalMs - now());
    if (delay > 0) await sleep(delay);
    limiterState.lastStartedAt = now();
    return task();
  });
  limiterState.tail = run.catch(() => undefined);
  return run;
}

async function smsEnvoieRequest(method, path, body, context) {
  const { config, fetchImpl, now, sleep } = context;

  if (!config.apiKey) {
    throw new SmsEnvoieError('Configuration SMSEnvoie incomplète : SMSENVOIE_API_KEY est manquante', {
      kind: 'account',
      code: 'missing_api_key'
    });
  }
  if (typeof fetchImpl !== 'function') {
    throw new SmsEnvoieError('Client HTTP indisponible pour SMSEnvoie', { kind: 'transient' });
  }

  return scheduleRequest(async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      let response;
      try {
        response = await fetchImpl(`${config.apiUrl}${path}`, {
          method,
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: body ? JSON.stringify(body) : undefined,
          signal: controller.signal
        });
      } catch (error) {
        const message = error?.name === 'AbortError'
          ? `SMSEnvoie ne répond pas (délai de ${config.timeoutMs} ms dépassé)`
          : `SMSEnvoie injoignable : ${error?.message || error}`;
        throw new SmsEnvoieError(message, { kind: 'transient', code: 'network_error' });
      }

      const rawText = await response.text();
      let payload;
      try {
        payload = rawText ? JSON.parse(rawText) : {};
      } catch {
        throw new SmsEnvoieError(`Réponse SMSEnvoie illisible (HTTP ${response.status})`, {
          kind: response.status >= 500 ? 'transient' : classifySmsEnvoieFailure(response.status, null),
          code: 'invalid_response',
          httpStatus: response.status
        });
      }

      if (!response.ok || payload?.ok === false) {
        const code = payload?.code || null;
        throw new SmsEnvoieError(
          String(payload?.error || payload?.message || `Erreur SMSEnvoie (HTTP ${response.status})`),
          { kind: classifySmsEnvoieFailure(response.status, code), code, httpStatus: response.status }
        );
      }

      return payload;
    } finally {
      clearTimeout(timeout);
    }
  }, { minIntervalMs: config.minIntervalMs, now, sleep });
}

function buildContext(options = {}) {
  const env = options.env || process.env;
  return {
    env,
    config: getSmsEnvoieConfiguration(env),
    fetchImpl: options.fetchImpl || globalThis.fetch,
    now: options.now || Date.now,
    sleep: options.sleep || wait,
    logger: options.logger || console,
    getDb: options.db ? async () => options.db : getDefaultDb
  };
}

let defaultDbPromise = null;
async function getDefaultDb() {
  if (!defaultDbPromise) {
    defaultDbPromise = import('../config/prisma.js').then((module) => module.default);
  }
  return defaultDbPromise;
}

/* ------------------------------------------------------------------ */
/*  Téléphone (Xiaomi1)                                                */
/* ------------------------------------------------------------------ */

const deviceCache = { key: null, device: null, fetchedAt: 0 };

export function resetSmsEnvoieStateForTests() {
  limiterState.tail = Promise.resolve();
  limiterState.lastStartedAt = 0;
  deviceCache.key = null;
  deviceCache.device = null;
  deviceCache.fetchedAt = 0;
  outboxState.running = false;
  outboxState.rerun = false;
  outboxState.pausedUntil = 0;
  outboxState.pauseReason = null;
}

export async function resolveSmsEnvoieDevice(context) {
  const { config, now } = context;

  if (config.deviceId) {
    return { id: config.deviceId, name: config.deviceId, online: null };
  }

  const cacheKey = `${config.apiUrl}|${config.apiKey.slice(-6)}|${normalizeDeviceName(config.deviceName)}`;
  if (deviceCache.key === cacheKey && deviceCache.device && now() - deviceCache.fetchedAt < DEVICE_CACHE_TTL_MS) {
    return deviceCache.device;
  }

  const payload = await smsEnvoieRequest('GET', '/devices', null, context);
  const devices = Array.isArray(payload?.devices) ? payload.devices : [];
  const device = findSmsEnvoieDevice(devices, config.deviceName);

  if (!device?.id) {
    const names = devices.map((item) => item?.name).filter(Boolean).join(', ') || 'aucun';
    throw new SmsEnvoieError(
      `Téléphone « ${config.deviceName} » introuvable dans SMSEnvoie (téléphones du compte : ${names})`,
      { kind: 'account', code: 'device_not_found' }
    );
  }

  const resolved = { id: String(device.id), name: String(device.name || config.deviceName), online: device.online ?? null };
  deviceCache.key = cacheKey;
  deviceCache.device = resolved;
  deviceCache.fetchedAt = now();

  if (resolved.online === false) {
    context.logger.warn?.(`⚠️ SMSEnvoie : le téléphone ${resolved.name} est hors ligne, les SMS attendront sa reconnexion`);
  }

  return resolved;
}

function invalidateDeviceCache() {
  deviceCache.key = null;
  deviceCache.device = null;
  deviceCache.fetchedAt = 0;
}

/* ------------------------------------------------------------------ */
/*  Envoi d'un SMS                                                      */
/* ------------------------------------------------------------------ */

export function buildSmsEnvoieSendBody({ phoneNumber, message, type, orderId }, device, config) {
  const body = {
    to: phoneNumber,
    message,
    device_id: device.id,
    priority: isMarketingSmsType(type) ? 0 : 1,
    name: `AFGestion - ${type || 'NOTIFICATION'}${orderId ? ` - commande ${orderId}` : ''}`
  };

  if (config.simSlot !== null) {
    body.sim_slot = config.simSlot;
  }

  return body;
}

async function dispatchSmsEnvoieMessage(log, context) {
  if (context.config.simSlotInvalid) {
    throw new SmsEnvoieError('SMSENVOIE_SIM_SLOT doit être 0 (SIM 1), 1 (SIM 2) ou vide (automatique)', {
      kind: 'account',
      code: 'invalid_sim_slot'
    });
  }

  const device = await resolveSmsEnvoieDevice(context);
  const body = buildSmsEnvoieSendBody(log, device, context.config);

  let payload;
  try {
    payload = await smsEnvoieRequest('POST', '/sms', body, context);
  } catch (error) {
    if (error?.kind === 'account' && !context.config.deviceId) {
      invalidateDeviceCache();
    }
    throw error;
  }

  const parsed = parseSmsEnvoieSendResponse(payload);
  if (!parsed.success) {
    throw new SmsEnvoieError(parsed.error, {
      kind: classifySmsEnvoieFailure(200, parsed.code),
      code: parsed.code
    });
  }

  return { ...parsed, device };
}

/* ------------------------------------------------------------------ */
/*  File d'envoi (SmsLog PENDING)                                       */
/* ------------------------------------------------------------------ */

const outboxState = {
  running: false,
  rerun: false,
  pausedUntil: 0,
  pauseReason: null,
  started: false,
  timer: null
};

export function getSmsEnvoieRetryDelayMs(attempts) {
  if (!attempts || attempts <= 0) return 0;
  return Math.min(2 ** (attempts - 1), 30) * MINUTE_MS;
}

function isEligible(log, nowMs) {
  if ((log.attempts || 0) >= SMSENVOIE_MAX_ATTEMPTS) return false;
  if (!log.lastAttemptAt) return true;
  return nowMs - new Date(log.lastAttemptAt).getTime() >= getSmsEnvoieRetryDelayMs(log.attempts);
}

function pauseOutbox(context, durationMs, reason) {
  outboxState.pausedUntil = context.now() + durationMs;
  outboxState.pauseReason = reason;
}

export function getSmsEnvoieOutboxState() {
  return {
    running: outboxState.running,
    pausedUntil: outboxState.pausedUntil ? new Date(outboxState.pausedUntil) : null,
    pauseReason: outboxState.pauseReason
  };
}

async function failExpiredMessages(db, context) {
  const nowMs = context.now();
  const cutoff = new Date(nowMs - context.config.maxAgeMs);

  const expired = await db.smsLog.updateMany({
    where: {
      provider: SMSENVOIE_PROVIDER_NAME,
      status: 'PENDING',
      sentAt: { lt: cutoff }
    },
    data: {
      status: 'FAILED',
      providerStatus: 'expired',
      errorMessage: 'SMS non envoyé : resté trop longtemps en attente (envoi annulé pour éviter un message en retard)'
    }
  });

  return expired?.count || 0;
}

async function pickNextMessage(db, context) {
  const nowMs = context.now();
  const pending = await db.smsLog.findMany({
    where: { provider: SMSENVOIE_PROVIDER_NAME, status: 'PENDING' },
    orderBy: { sentAt: 'asc' },
    take: OUTBOX_BATCH_SIZE
  });

  for (const log of pending) {
    if ((log.attempts || 0) >= SMSENVOIE_MAX_ATTEMPTS
      && log.lastAttemptAt
      && nowMs - new Date(log.lastAttemptAt).getTime() >= 5 * MINUTE_MS) {
      await db.smsLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', errorMessage: log.errorMessage || 'Nombre maximal de tentatives atteint' }
      });
    }
  }

  const eligible = pending.filter((log) => isEligible(log, nowMs));
  return eligible.find((log) => !isMarketingSmsType(log.type))
    || eligible.find((log) => isMarketingSmsType(log.type))
    || null;
}

async function claimMessage(db, log, context) {
  const claimed = await db.smsLog.updateMany({
    where: { id: log.id, status: 'PENDING', attempts: log.attempts || 0 },
    data: { attempts: { increment: 1 }, lastAttemptAt: new Date(context.now()) }
  });
  return claimed?.count === 1;
}

/**
 * Envoie un SMS déjà réservé (tentative comptée) et met à jour son journal.
 * Retourne { outcome: 'sent' | 'retry' | 'failed' | 'released', error? }.
 */
async function sendClaimedMessage(db, log, context, { failAccountErrors = false } = {}) {
  const attempts = (log.attempts || 0) + 1;

  try {
    const result = await dispatchSmsEnvoieMessage(log, context);

    await db.smsLog.update({
      where: { id: log.id },
      data: {
        status: 'SENT',
        providerId: result.campaignId,
        providerStatus: result.status || 'queued',
        errorMessage: null,
        sentAt: new Date(context.now())
      }
    });

    context.logger.log?.(
      `📱 SMS confié à SMSEnvoie (${result.device.name}${context.config.simSlot === null ? '' : `, SIM ${context.config.simSlot + 1}`}) : ${log.phoneNumber}`
    );
    return { outcome: 'sent', campaignId: result.campaignId };
  } catch (error) {
    const kind = error?.kind || 'transient';
    const message = error?.message || String(error);

    if (kind === 'permanent' || (failAccountErrors && kind === 'account')) {
      await db.smsLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', providerStatus: error?.code || kind, errorMessage: message }
      });
      context.logger.error?.(`❌ SMS refusé par SMSEnvoie pour ${log.phoneNumber} : ${message}`);
      return { outcome: 'failed', error: message, kind };
    }

    if (kind === 'rate_limited' || kind === 'account') {
      // Problème de compte ou de limite : la tentative ne compte pas pour ce SMS.
      await db.smsLog.update({
        where: { id: log.id },
        data: { attempts: { decrement: 1 }, providerStatus: error?.code || kind, errorMessage: message }
      });
      pauseOutbox(context, kind === 'rate_limited' ? RATE_LIMIT_PAUSE_MS : ACCOUNT_ERROR_PAUSE_MS, message);
      context.logger.error?.(`⏸️ File SMSEnvoie en pause : ${message}`);
      return { outcome: 'released', error: message, kind };
    }

    if (attempts >= SMSENVOIE_MAX_ATTEMPTS) {
      await db.smsLog.update({
        where: { id: log.id },
        data: { status: 'FAILED', providerStatus: error?.code || kind, errorMessage: message }
      });
      context.logger.error?.(`❌ SMS abandonné après ${attempts} tentatives pour ${log.phoneNumber} : ${message}`);
      return { outcome: 'failed', error: message, kind };
    }

    await db.smsLog.update({
      where: { id: log.id },
      data: { providerStatus: error?.code || kind, errorMessage: message }
    });
    // Réseau ou serveur indisponible : courte pause pour ne pas enchaîner les échecs.
    pauseOutbox(context, TRANSIENT_ERROR_PAUSE_MS, message);
    context.logger.warn?.(`🔁 SMS SMSEnvoie à réessayer (${attempts}/${SMSENVOIE_MAX_ATTEMPTS}) pour ${log.phoneNumber} : ${message}`);
    return { outcome: 'retry', error: message, kind };
  }
}

/**
 * Traite le prochain SMS en attente. Retourne { idle }, { paused } ou le résultat d'envoi.
 */
export async function processNextSmsEnvoieMessage(options = {}) {
  const context = buildContext(options);
  if (!context.config.apiKey) return { idle: true, reason: 'not_configured' };
  if (context.now() < outboxState.pausedUntil) return { paused: true, reason: outboxState.pauseReason };

  const db = await context.getDb();
  const log = await pickNextMessage(db, context);
  if (!log) return { idle: true };

  if (!(await claimMessage(db, log, context))) return { skipped: true, smsLogId: log.id };

  const result = await sendClaimedMessage(db, log, context);
  return { ...result, smsLogId: log.id };
}

/**
 * Vide la file (dans la limite de débit). Utilisé par le minuteur et après chaque mise en file.
 */
export async function drainSmsEnvoieOutbox(options = {}) {
  const context = buildContext(options);
  if (!context.config.apiKey) return { processed: 0, expired: 0, reason: 'not_configured' };

  const db = await context.getDb();
  const expired = await failExpiredMessages(db, context);
  const summary = { processed: 0, sent: 0, failed: 0, retry: 0, released: 0, expired };

  for (let index = 0; index < MAX_MESSAGES_PER_DRAIN; index += 1) {
    const result = await processNextSmsEnvoieMessage(options);
    if (result.idle || result.paused) break;
    if (result.skipped) continue;
    summary.processed += 1;
    if (summary[result.outcome] !== undefined) summary[result.outcome] += 1;
    if (result.outcome === 'released' || result.outcome === 'retry') break;
  }

  return summary;
}

export function kickSmsEnvoieOutbox(options = {}) {
  const env = options.env || process.env;
  if (!isSmsEnvoieConfigured(env)) return;

  if (outboxState.running) {
    outboxState.rerun = true;
    return;
  }

  outboxState.running = true;
  (async () => {
    try {
      do {
        outboxState.rerun = false;
        await drainSmsEnvoieOutbox(options);
      } while (outboxState.rerun);
    } catch (error) {
      (options.logger || console).error(`❌ File SMSEnvoie : ${error?.message || error}`);
    } finally {
      outboxState.running = false;
    }
  })();
}

/**
 * Démarre la file d'envoi (au lancement du serveur).
 * Elle tourne dès qu'une clé SMSEnvoie est configurée, même si SMS8 est
 * redevenu le fournisseur actif, afin de finir les SMS déjà en attente.
 */
export function startSmsEnvoieOutbox(options = {}) {
  const env = options.env || process.env;
  const logger = options.logger || console;

  if (!isSmsEnvoieConfigured(env)) {
    return false;
  }
  if (outboxState.started) return true;

  outboxState.started = true;
  outboxState.timer = setInterval(() => kickSmsEnvoieOutbox(options), OUTBOX_POLL_INTERVAL_MS);
  outboxState.timer.unref?.();
  kickSmsEnvoieOutbox(options);

  const publicConfig = getSmsEnvoiePublicConfiguration(env);
  logger.log(
    `✅ File SMSEnvoie active (téléphone ${publicConfig.deviceId || publicConfig.deviceName}, ${publicConfig.simLabel}, `
    + `≤ ${publicConfig.maxPerMinute} requêtes/min)`
  );
  return true;
}

/* ------------------------------------------------------------------ */
/*  Mise en file (appelé par sms.service.js)                            */
/* ------------------------------------------------------------------ */

async function createFailedLog(db, { phoneNumber, message, metadata, error, context }) {
  try {
    return await db.smsLog.create({
      data: {
        phoneNumber: String(phoneNumber || ''),
        message: String(message || ''),
        status: 'FAILED',
        provider: SMSENVOIE_PROVIDER_NAME,
        errorMessage: error,
        orderId: metadata.orderId || null,
        userId: metadata.userId || null,
        type: metadata.type || 'NOTIFICATION',
        sentAt: new Date(context.now())
      }
    });
  } catch (logError) {
    context.logger.error?.(`❌ Erreur journal SMS : ${logError.message}`);
    return null;
  }
}

/**
 * Met un SMS en file d'envoi SMSEnvoie.
 * - par défaut : retourne immédiatement { success: true, queued: true, smsLogId }
 * - metadata.immediate : tente l'envoi tout de suite (tests depuis l'administration)
 */
export async function enqueueSmsEnvoieMessage(phone, message, metadata = {}, options = {}) {
  try {
    return await queueSmsEnvoieMessage(phone, message, metadata, options);
  } catch (error) {
    // Même contrat que l'envoi SMS8 : ne jamais faire échouer l'action métier (commande, livraison…).
    (options.logger || console).error(`❌ Erreur mise en file SMSEnvoie : ${error?.message || error}`);
    return { success: false, error: error?.message || String(error), provider: SMSENVOIE_PROVIDER_NAME };
  }
}

async function queueSmsEnvoieMessage(phone, message, metadata, options) {
  const context = buildContext(options);
  const db = await context.getDb();
  const cleanPhone = cleanPhoneNumber(phone);
  const text = typeof message === 'string' ? message.trim() : '';

  let validationError = null;
  if (!context.config.apiKey) {
    validationError = 'Configuration SMSEnvoie incomplète : SMSENVOIE_API_KEY est manquante';
  } else if (!cleanPhone || !/^\+[1-9]\d{7,14}$/.test(String(cleanPhone))) {
    validationError = 'Numéro de téléphone invalide';
  } else if (!text) {
    validationError = 'Message vide';
  }

  if (validationError) {
    const failedLog = await createFailedLog(db, { phoneNumber: cleanPhone || phone, message, metadata, error: validationError, context });
    context.logger.error?.(`❌ SMS non mis en file (${validationError}) : ${phone}`);
    return { success: false, smsLogId: failedLog?.id, error: validationError, provider: SMSENVOIE_PROVIDER_NAME };
  }

  const log = await db.smsLog.create({
    data: {
      phoneNumber: cleanPhone,
      message: text,
      status: 'PENDING',
      provider: SMSENVOIE_PROVIDER_NAME,
      orderId: metadata.orderId || null,
      userId: metadata.userId || null,
      type: metadata.type || 'NOTIFICATION',
      attempts: 0,
      sentAt: new Date(context.now())
    }
  });

  if (metadata.immediate) {
    // Test depuis l'administration : on tente tout de suite pour afficher l'erreur éventuelle.
    if (await claimMessage(db, log, context)) {
      const result = await sendClaimedMessage(db, log, context, { failAccountErrors: true });
      if (result.outcome === 'sent') {
        return { success: true, smsLogId: log.id, messageId: result.campaignId, provider: SMSENVOIE_PROVIDER_NAME };
      }
      if (result.outcome === 'failed') {
        return { success: false, smsLogId: log.id, error: result.error, provider: SMSENVOIE_PROVIDER_NAME };
      }
    }
    if (options.autoKick !== false) kickSmsEnvoieOutbox(options);
    return {
      success: true,
      queued: true,
      smsLogId: log.id,
      provider: SMSENVOIE_PROVIDER_NAME,
      message: 'SMS mis en file d’envoi SMSEnvoie (envoi dans quelques instants)'
    };
  }

  if (options.autoKick !== false) kickSmsEnvoieOutbox(options);
  return { success: true, queued: true, smsLogId: log.id, provider: SMSENVOIE_PROVIDER_NAME };
}

/**
 * Consommation SMSEnvoie du mois (GET /api/v1/quota).
 */
export async function getSmsEnvoieQuota(options = {}) {
  const context = buildContext(options);
  const payload = await smsEnvoieRequest('GET', '/quota', null, context);
  return {
    planName: payload?.plan?.name || null,
    smsQuotaMonth: payload?.plan?.sms_quota_month ?? null,
    usedThisMonth: payload?.sms_used_this_month ?? null,
    remaining: payload?.quota_remaining ?? null
  };
}

export default {
  SMSENVOIE_PROVIDER_NAME,
  getSmsEnvoieConfiguration,
  getSmsEnvoiePublicConfiguration,
  isSmsEnvoieConfigured,
  enqueueSmsEnvoieMessage,
  processNextSmsEnvoieMessage,
  drainSmsEnvoieOutbox,
  kickSmsEnvoieOutbox,
  startSmsEnvoieOutbox,
  getSmsEnvoieQuota
};
