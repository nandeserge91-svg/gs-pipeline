import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getWasenderConfiguration,
  isWhatsAppMessageTypeAllowed,
  parseWasenderResponse,
  resetWasenderQueueForTests,
  sendWhatsAppMessage
} from '../services/wasender.service.js';

const enabledEnv = {
  WHATSAPP_ENABLED: 'true',
  WASENDER_API_KEY: 'session-test-key',
  WASENDER_API_URL: 'https://www.wasenderapi.com/api'
};

function createFakeDb() {
  const logs = [];
  return {
    logs,
    smsLog: {
      findFirst: async () => null,
      create: async ({ data }) => {
        const row = { id: logs.length + 1, ...data };
        logs.push(row);
        return row;
      },
      update: async ({ where, data }) => {
        const row = logs.find(item => item.id === where.id);
        Object.assign(row, data);
        return row;
      }
    }
  };
}

test('désactive WhatsApp sans modifier le canal SMS', async () => {
  const result = await sendWhatsAppMessage('+2250700000000', 'Test', {}, {
    env: { WHATSAPP_ENABLED: 'false' }
  });

  assert.equal(result.success, true);
  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'WHATSAPP_DISABLED');
});

test('autorise uniquement le message d’assignation livreur', async () => {
  assert.equal(isWhatsAppMessageTypeAllowed({ type: 'DELIVERY_ASSIGNED' }), true);
  assert.equal(isWhatsAppMessageTypeAllowed({ type: 'ORDER_CREATED' }), false);
  assert.equal(isWhatsAppMessageTypeAllowed({ type: 'EXPRESS_REMINDER' }), false);
  assert.equal(isWhatsAppMessageTypeAllowed({ type: 'MARKETING_RELANCE_J3' }), false);

  let requestCount = 0;
  const result = await sendWhatsAppMessage(
    '+2250700000000',
    'Commande reçue',
    { type: 'ORDER_CREATED' },
    {
      env: enabledEnv,
      httpClient: { post: async () => { requestCount += 1; } }
    }
  );

  assert.equal(result.success, true);
  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'WHATSAPP_EVENT_DISABLED');
  assert.equal(requestCount, 0);
});

test('reconnaît une réponse WaSenderAPI mise en file', () => {
  const result = parseWasenderResponse({
    success: true,
    data: {
      msgId: 100000,
      jid: '+2250700000000',
      status: 'in_progress'
    }
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.messageData.msgId, 100000);
  assert.equal(result.providerStatus, 'in_progress');
});

test('journalise en attente puis accepté avec la clé de session', async () => {
  resetWasenderQueueForTests();
  const requests = [];
  const db = createFakeDb();
  const httpClient = {
    post: async (...args) => {
      requests.push(args);
      return {
        data: {
          success: true,
          data: { msgId: 12345, status: 'in_progress' }
        }
      };
    }
  };

  const result = await sendWhatsAppMessage(
    '+2250700000000',
    'Votre colis est en route',
    { orderId: 12, type: 'DELIVERY_ASSIGNED' },
    { db, httpClient, env: enabledEnv, minimumInterval: 0 }
  );

  assert.equal(result.success, true);
  assert.equal(requests[0][0], 'https://www.wasenderapi.com/api/send-message');
  assert.deepEqual(requests[0][1], {
    to: '+2250700000000',
    text: 'Votre colis est en route'
  });
  assert.equal(requests[0][2].headers.Authorization, 'Bearer session-test-key');
  assert.equal(db.logs[0].provider, 'WaSenderAPI');
  assert.equal(db.logs[0].status, 'SENT');
  assert.equal(db.logs[0].attempts, 1);
  assert.equal(db.logs[0].providerId, '12345');
});

test('réessaie automatiquement après une limitation WaSenderAPI', async () => {
  resetWasenderQueueForTests();
  const db = createFakeDb();
  let requestCount = 0;
  const httpClient = {
    post: async () => {
      requestCount += 1;
      if (requestCount === 1) {
        const error = new Error('rate limited');
        error.response = {
          status: 429,
          data: { message: 'Account protection enabled', retry_after: 0 }
        };
        throw error;
      }
      return { data: { success: true, data: { msgId: 77, status: 'sent' } } };
    }
  };

  const result = await sendWhatsAppMessage('+2250700000001', 'Deuxième essai', { type: 'DELIVERY_ASSIGNED' }, {
    db,
    httpClient,
    env: enabledEnv,
    minimumInterval: 0,
    maxAttempts: 2,
    sleep: async () => undefined
  });

  assert.equal(result.success, true);
  assert.equal(requestCount, 2);
  assert.equal(db.logs[0].attempts, 2);
  assert.equal(db.logs[0].status, 'SENT');
});

test('espace deux envois simultanés de cinq secondes', async () => {
  resetWasenderQueueForTests();
  const db = createFakeDb();
  let clock = 10000;
  const waits = [];
  const options = {
    db,
    env: enabledEnv,
    minimumInterval: 5000,
    now: () => clock,
    sleep: async milliseconds => {
      waits.push(milliseconds);
      clock += milliseconds;
    },
    httpClient: {
      post: async () => ({
        data: { success: true, data: { msgId: Math.random(), status: 'sent' } }
      })
    }
  };

  await Promise.all([
    sendWhatsAppMessage('+2250700000002', 'Premier', { type: 'DELIVERY_ASSIGNED' }, options),
    sendWhatsAppMessage('+2250700000003', 'Deuxième', { type: 'DELIVERY_ASSIGNED' }, options)
  ]);

  assert.deepEqual(waits, [5000]);
});

test('n’expose jamais la clé dans la configuration administrateur', () => {
  const config = getWasenderConfiguration({
    WHATSAPP_ENABLED: 'true',
    WASENDER_API_KEY: 'secret-value'
  });

  assert.equal(config.configured, true);
  assert.equal(config.enabled, true);
  assert.equal(Object.hasOwn(config, 'apiKey'), false);
  assert.equal(JSON.stringify(config).includes('secret-value'), false);
});
