import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSmsEnvoieSendBody,
  classifySmsEnvoieFailure,
  drainSmsEnvoieOutbox,
  enqueueSmsEnvoieMessage,
  findSmsEnvoieDevice,
  getSmsEnvoieConfiguration,
  getSmsEnvoiePublicConfiguration,
  getSmsEnvoieRetryDelayMs,
  parseSmsEnvoieSendResponse,
  processNextSmsEnvoieMessage,
  resetSmsEnvoieStateForTests,
  SMSENVOIE_MAX_ATTEMPTS,
  SMSENVOIE_PROVIDER_NAME
} from '../services/smsenvoie.service.js';
import { getActiveSmsProvider } from '../services/sms.service.js';

const API_KEY = 'sk_test_non_secret_123456';
const env = {
  SMSENVOIE_API_KEY: API_KEY,
  SMSENVOIE_DEVICE_NAME: 'Xiaomi1',
  SMSENVOIE_SIM_SLOT: '0'
};

const silentLogger = { log() {}, warn() {}, error() {} };

const DEVICES = [
  { id: 'dev-samsung', name: 'Samsung Boutique', online: true },
  { id: 'dev-xiaomi1', name: 'Xiaomi1', online: true }
];

function jsonResponse(status, payload) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async text() {
      return JSON.stringify(payload);
    }
  };
}

function createFetch(handler) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    const call = {
      url,
      method: options.method,
      headers: options.headers,
      rawBody: options.body || null,
      body: options.body ? JSON.parse(options.body) : null
    };
    calls.push(call);
    return handler(call, calls.length);
  };
  return { fetchImpl, calls };
}

function okFetch(extraHandler) {
  return createFetch((call) => {
    if (call.method === 'GET' && call.url.endsWith('/devices')) {
      return jsonResponse(200, { ok: true, devices: DEVICES });
    }
    if (extraHandler) return extraHandler(call);
    return jsonResponse(200, {
      ok: true,
      campaign_id: `campaign-${call.body?.to}`,
      total: 1,
      skipped_optout: 0,
      invalid: 0,
      status: 'queued'
    });
  });
}

function createClock(start = Date.parse('2026-09-27T10:00:00.000Z')) {
  let current = start;
  const waits = [];
  return {
    waits,
    now: () => current,
    sleep: async (milliseconds) => {
      waits.push(milliseconds);
      current += milliseconds;
    },
    advance: (milliseconds) => {
      current += milliseconds;
    }
  };
}

function matches(row, where = {}) {
  return Object.entries(where).every(([key, condition]) => {
    const value = row[key];
    if (condition && typeof condition === 'object' && !(condition instanceof Date)) {
      if ('lt' in condition) return value != null && new Date(value) < new Date(condition.lt);
      if ('in' in condition) return condition.in.includes(value);
      if ('not' in condition) return value !== condition.not;
      return false;
    }
    return value === condition;
  });
}

function applyData(row, data) {
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === 'object' && !(value instanceof Date)) {
      if ('increment' in value) row[key] = (row[key] || 0) + value.increment;
      if ('decrement' in value) row[key] = (row[key] || 0) - value.decrement;
    } else {
      row[key] = value;
    }
  }
}

function createDb(initialRows = []) {
  const rows = initialRows.map((row) => ({
    attempts: 0,
    lastAttemptAt: null,
    providerId: null,
    providerStatus: null,
    errorMessage: null,
    provider: SMSENVOIE_PROVIDER_NAME,
    status: 'PENDING',
    ...row
  }));
  let nextId = 1000;

  return {
    rows,
    smsLog: {
      async create({ data }) {
        const row = {
          id: nextId++,
          attempts: 0,
          lastAttemptAt: null,
          providerId: null,
          providerStatus: null,
          errorMessage: null,
          ...data
        };
        rows.push(row);
        return { ...row };
      },
      async findMany({ where, take }) {
        return rows
          .filter((row) => matches(row, where))
          .sort((left, right) => new Date(left.sentAt) - new Date(right.sentAt))
          .slice(0, take ?? rows.length)
          .map((row) => ({ ...row }));
      },
      async updateMany({ where, data }) {
        const found = rows.filter((row) => matches(row, where));
        found.forEach((row) => applyData(row, data));
        return { count: found.length };
      },
      async update({ where, data }) {
        const row = rows.find((item) => item.id === where.id);
        applyData(row, data);
        return { ...row };
      }
    }
  };
}

function pendingRow(overrides = {}) {
  return {
    id: 1,
    phoneNumber: '+2250701020304',
    message: 'Bonjour Awa, votre commande est enregistree. - AFGestion',
    type: 'ORDER_CREATED',
    orderId: 42,
    userId: null,
    sentAt: new Date('2026-09-27T09:59:00.000Z'),
    ...overrides
  };
}

test.beforeEach(() => {
  resetSmsEnvoieStateForTests();
});

test('SMSEnvoie devient le fournisseur actif dès que la clé API est présente', () => {
  assert.equal(getActiveSmsProvider({}), 'SMS8');
  assert.equal(getActiveSmsProvider({ SMSENVOIE_API_KEY: API_KEY }), 'SMSENVOIE');
  assert.equal(getActiveSmsProvider({ SMSENVOIE_API_KEY: API_KEY, SMS_PROVIDER: 'sms8' }), 'SMS8');
  assert.equal(getActiveSmsProvider({ SMS_PROVIDER: 'SMSENVOIE' }), 'SMSENVOIE');
});

test('utilise le téléphone Xiaomi1 par défaut et lit l’emplacement SIM', () => {
  const defaults = getSmsEnvoieConfiguration({ SMSENVOIE_API_KEY: API_KEY });
  assert.equal(defaults.deviceName, 'Xiaomi1');
  assert.equal(defaults.simSlot, null);
  assert.equal(defaults.minIntervalMs, 7000);

  assert.equal(getSmsEnvoieConfiguration({ SMSENVOIE_SIM_SLOT: '1' }).simSlot, 1);
  assert.equal(getSmsEnvoieConfiguration({ SMSENVOIE_SIM_SLOT: '3' }).simSlotInvalid, true);
  // Jamais moins de 6 s entre deux requêtes (limite API : 10 / minute)
  assert.equal(getSmsEnvoieConfiguration({ SMSENVOIE_MIN_INTERVAL_MS: '1000' }).minIntervalMs, 6000);

  const publicConfig = getSmsEnvoiePublicConfiguration(env);
  assert.equal(publicConfig.deviceName, 'Xiaomi1');
  assert.equal(publicConfig.simLabel, 'SIM 1');
  assert.equal(publicConfig.configured, true);
  assert.equal(JSON.stringify(publicConfig).includes(API_KEY), false);
  assert.equal(getSmsEnvoiePublicConfiguration({ SMSENVOIE_API_KEY: API_KEY }).simLabel, 'Automatique');
});

test('retrouve le téléphone par son nom, même écrit autrement', () => {
  assert.equal(findSmsEnvoieDevice(DEVICES, 'Xiaomi1').id, 'dev-xiaomi1');
  assert.equal(findSmsEnvoieDevice(DEVICES, 'xiaomi 1').id, 'dev-xiaomi1');
  assert.equal(findSmsEnvoieDevice([
    { id: 'old', name: 'Xiaomi1', online: false },
    { id: 'new', name: 'Xiaomi1', online: true }
  ], 'Xiaomi1').id, 'new');
  assert.equal(findSmsEnvoieDevice(DEVICES, 'Pixel'), null);
});

test('envoie par Xiaomi1 sur la SIM choisie, sans mettre la clé dans le corps', async () => {
  const db = createDb([pendingRow()]);
  const clock = createClock();
  const { fetchImpl, calls } = okFetch();

  const result = await processNextSmsEnvoieMessage({
    db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });

  assert.equal(result.outcome, 'sent');
  assert.equal(calls[0].method, 'GET');
  assert.equal(calls[0].url, 'https://smsenvoie.com/api/v1/devices');
  assert.equal(calls[1].method, 'POST');
  assert.equal(calls[1].url, 'https://smsenvoie.com/api/v1/sms');
  assert.equal(calls[1].headers.Authorization, `Bearer ${API_KEY}`);
  assert.deepEqual(calls[1].body, {
    to: '+2250701020304',
    message: 'Bonjour Awa, votre commande est enregistree. - AFGestion',
    device_id: 'dev-xiaomi1',
    priority: 1,
    name: 'AFGestion - ORDER_CREATED - commande 42',
    sim_slot: 0
  });
  assert.equal(calls[1].rawBody.includes(API_KEY), false);

  const row = db.rows[0];
  assert.equal(row.status, 'SENT');
  assert.equal(row.providerId, 'campaign-+2250701020304');
  assert.equal(row.providerStatus, 'queued');
  assert.equal(row.attempts, 1);
});

test('respecte la limite de 10 requêtes par minute et garde le téléphone en cache', async () => {
  const db = createDb([pendingRow({ id: 1 }), pendingRow({ id: 2, phoneNumber: '+2250505050505' })]);
  const clock = createClock();
  const { fetchImpl, calls } = okFetch();
  const options = { db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger };

  await processNextSmsEnvoieMessage(options);
  await processNextSmsEnvoieMessage(options);

  // 1 recherche du téléphone + 2 envois : la liste des téléphones n'est lue qu'une fois
  assert.equal(calls.filter((call) => call.url.endsWith('/devices')).length, 1);
  assert.equal(calls.filter((call) => call.url.endsWith('/sms')).length, 2);
  // 7 s d'écart entre chaque requête
  assert.deepEqual(clock.waits, [7000, 7000]);
  assert.deepEqual(db.rows.map((row) => row.status), ['SENT', 'SENT']);
});

test('omet la SIM quand elle n’est pas imposée et baisse la priorité des relances marketing', () => {
  const body = buildSmsEnvoieSendBody(
    { phoneNumber: '+2250701020304', message: 'Offre', type: 'MARKETING_RELANCE_J3', orderId: null },
    { id: 'dev-xiaomi1' },
    getSmsEnvoieConfiguration({ SMSENVOIE_API_KEY: API_KEY })
  );
  assert.equal('sim_slot' in body, false);
  assert.equal(body.priority, 0);
  assert.equal(body.name, 'AFGestion - MARKETING_RELANCE_J3');
});

test('envoie les SMS de commande avant les relances marketing', async () => {
  const db = createDb([
    pendingRow({ id: 1, type: 'MARKETING_RELANCE_J3', sentAt: new Date('2026-09-27T09:00:00.000Z') }),
    pendingRow({ id: 2, type: 'ORDER_VALIDATED', sentAt: new Date('2026-09-27T09:30:00.000Z') })
  ]);
  const clock = createClock();
  const { fetchImpl } = okFetch();

  const result = await processNextSmsEnvoieMessage({
    db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });

  assert.equal(result.smsLogId, 2);
  assert.equal(db.rows.find((row) => row.id === 1).status, 'PENDING');
});

test('limite SMSEnvoie atteinte : le SMS reste en attente sans consommer de tentative', async () => {
  const db = createDb([pendingRow()]);
  const clock = createClock();
  const { fetchImpl } = okFetch(() => jsonResponse(429, { ok: false, error: 'Trop de requetes', code: 'rate_limited' }));
  const options = { db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger };

  const result = await processNextSmsEnvoieMessage(options);

  assert.equal(result.outcome, 'released');
  assert.equal(db.rows[0].status, 'PENDING');
  assert.equal(db.rows[0].attempts, 0);
  assert.deepEqual(await processNextSmsEnvoieMessage(options), { paused: true, reason: 'Trop de requetes' });

  clock.advance(61 * 1000);
  const { fetchImpl: recoveredFetch } = okFetch();
  const retry = await processNextSmsEnvoieMessage({ ...options, fetchImpl: recoveredFetch });
  assert.equal(retry.outcome, 'sent');
});

test('clé refusée ou téléphone introuvable : la file se met en pause et garde les SMS', async () => {
  const clock = createClock();
  const db = createDb([pendingRow()]);
  const { fetchImpl } = createFetch((call) => (call.url.endsWith('/devices')
    ? jsonResponse(200, { ok: true, devices: [{ id: 'dev-samsung', name: 'Samsung Boutique', online: true }] })
    : jsonResponse(200, { ok: true, campaign_id: 'c', total: 1, status: 'queued' })));

  const result = await processNextSmsEnvoieMessage({
    db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });

  assert.equal(result.outcome, 'released');
  assert.match(result.error, /Xiaomi1.*introuvable.*Samsung Boutique/);
  assert.equal(db.rows[0].status, 'PENDING');
  assert.equal(db.rows[0].attempts, 0);

  resetSmsEnvoieStateForTests();
  const db401 = createDb([pendingRow()]);
  const { fetchImpl: invalidKeyFetch } = createFetch(() => jsonResponse(401, { ok: false, error: 'Cle API invalide', code: 'invalid_api_key' }));
  const invalidKey = await processNextSmsEnvoieMessage({
    db: db401, env, fetchImpl: invalidKeyFetch, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });
  assert.equal(invalidKey.outcome, 'released');
  assert.equal(db401.rows[0].status, 'PENDING');
  assert.equal(db401.rows[0].errorMessage, 'Cle API invalide');
});

test('réseau indisponible : nouvelle tentative, puis échec après le maximum de tentatives', async () => {
  const clock = createClock();
  const brokenFetch = createFetch((call) => {
    if (call.url.endsWith('/devices')) return jsonResponse(200, { ok: true, devices: DEVICES });
    throw new TypeError('fetch failed');
  }).fetchImpl;

  const db = createDb([pendingRow()]);
  const first = await processNextSmsEnvoieMessage({
    db, env, fetchImpl: brokenFetch, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });
  assert.equal(first.outcome, 'retry');
  assert.equal(db.rows[0].status, 'PENDING');
  assert.equal(db.rows[0].attempts, 1);
  assert.match(db.rows[0].errorMessage, /injoignable/);

  resetSmsEnvoieStateForTests();
  const lastDb = createDb([pendingRow({
    attempts: SMSENVOIE_MAX_ATTEMPTS - 1,
    lastAttemptAt: new Date(clock.now() - 60 * 60 * 1000)
  })]);
  const last = await processNextSmsEnvoieMessage({
    db: lastDb, env, fetchImpl: brokenFetch, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });
  assert.equal(last.outcome, 'failed');
  assert.equal(lastDb.rows[0].status, 'FAILED');
});

test('numéro refusé ou client désinscrit (STOP) : échec définitif', async () => {
  assert.equal(parseSmsEnvoieSendResponse({ ok: true, total: 0, invalid: 1, skipped_optout: 0 }).code, 'invalid_to');
  assert.equal(parseSmsEnvoieSendResponse({ ok: true, total: 0, invalid: 0, skipped_optout: 1 }).code, 'skipped_optout');
  assert.equal(classifySmsEnvoieFailure(200, 'skipped_optout'), 'permanent');
  assert.equal(classifySmsEnvoieFailure(403, 'quota_exceeded'), 'account');
  assert.equal(classifySmsEnvoieFailure(400, 'missing_to'), 'permanent');
  assert.equal(classifySmsEnvoieFailure(502, null), 'transient');

  const db = createDb([pendingRow()]);
  const clock = createClock();
  const { fetchImpl } = okFetch(() => jsonResponse(200, { ok: true, campaign_id: 'c1', total: 0, invalid: 1, skipped_optout: 0, status: 'queued' }));
  const result = await processNextSmsEnvoieMessage({
    db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });
  assert.equal(result.outcome, 'failed');
  assert.equal(db.rows[0].status, 'FAILED');
  assert.match(db.rows[0].errorMessage, /invalide/);
});

test('met en file sans attendre l’API et refuse un numéro invalide', async () => {
  const db = createDb();
  const clock = createClock();
  const { fetchImpl, calls } = okFetch();
  const options = { db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger, autoKick: false };

  const queued = await enqueueSmsEnvoieMessage('07 01 02 03 04', 'Bonjour', { orderId: 7, type: 'DELIVERY_ASSIGNED', userId: 3 }, options);
  assert.deepEqual(queued, { success: true, queued: true, smsLogId: 1000, provider: SMSENVOIE_PROVIDER_NAME });
  assert.equal(calls.length, 0);
  assert.equal(db.rows[0].status, 'PENDING');
  assert.equal(db.rows[0].phoneNumber, '+2250701020304');
  assert.equal(db.rows[0].type, 'DELIVERY_ASSIGNED');

  const invalid = await enqueueSmsEnvoieMessage('', 'Bonjour', { type: 'ORDER_CREATED' }, options);
  assert.equal(invalid.success, false);
  assert.equal(db.rows[1].status, 'FAILED');

  const missingKey = await enqueueSmsEnvoieMessage('0701020304', 'Bonjour', {}, { ...options, env: {} });
  assert.equal(missingKey.success, false);
  assert.match(missingKey.error, /SMSENVOIE_API_KEY/);
});

test('un SMS de test part tout de suite et remonte une clé refusée', async () => {
  const clock = createClock();
  const db = createDb();
  const { fetchImpl } = okFetch();
  const sent = await enqueueSmsEnvoieMessage('0701020304', 'Test', { type: 'NOTIFICATION', immediate: true }, {
    db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger, autoKick: false
  });
  assert.equal(sent.success, true);
  assert.equal(sent.messageId, 'campaign-+2250701020304');
  assert.equal(db.rows[0].status, 'SENT');

  resetSmsEnvoieStateForTests();
  const failedDb = createDb();
  const { fetchImpl: invalidKeyFetch } = createFetch(() => jsonResponse(401, { ok: false, error: 'Cle API invalide', code: 'invalid_api_key' }));
  const failed = await enqueueSmsEnvoieMessage('0701020304', 'Test', { type: 'NOTIFICATION', immediate: true }, {
    db: failedDb, env, fetchImpl: invalidKeyFetch, now: clock.now, sleep: clock.sleep, logger: silentLogger, autoKick: false
  });
  assert.equal(failed.success, false);
  assert.equal(failed.error, 'Cle API invalide');
  assert.equal(failedDb.rows[0].status, 'FAILED');
});

test('abandonne un SMS resté trop longtemps en attente', async () => {
  const clock = createClock();
  const db = createDb([pendingRow({ sentAt: new Date(clock.now() - 13 * 60 * 60 * 1000) })]);
  const { fetchImpl, calls } = okFetch();

  const summary = await drainSmsEnvoieOutbox({
    db, env, fetchImpl, now: clock.now, sleep: clock.sleep, logger: silentLogger
  });

  assert.equal(summary.expired, 1);
  assert.equal(db.rows[0].status, 'FAILED');
  assert.equal(db.rows[0].providerStatus, 'expired');
  assert.equal(calls.length, 0);
});

test('espace les nouvelles tentatives de plus en plus', () => {
  assert.equal(getSmsEnvoieRetryDelayMs(0), 0);
  assert.equal(getSmsEnvoieRetryDelayMs(1), 60 * 1000);
  assert.equal(getSmsEnvoieRetryDelayMs(3), 4 * 60 * 1000);
  assert.equal(getSmsEnvoieRetryDelayMs(10), 30 * 60 * 1000);
});
