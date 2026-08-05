import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getWasenderConfiguration,
  parseWasenderResponse,
  sendWhatsAppMessage
} from '../services/wasender.service.js';

test('désactive WhatsApp sans modifier le canal SMS', async () => {
  const result = await sendWhatsAppMessage('+2250700000000', 'Test', {}, {
    env: { WHATSAPP_ENABLED: 'false' }
  });

  assert.equal(result.success, true);
  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'WHATSAPP_DISABLED');
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

test('envoie le même texte sur WhatsApp avec la clé de session', async () => {
  const requests = [];
  const logs = [];
  const db = {
    smsLog: {
      findFirst: async () => null,
      create: async ({ data }) => {
        logs.push(data);
        return { id: 42, ...data };
      }
    }
  };
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
    {
      db,
      httpClient,
      env: {
        WHATSAPP_ENABLED: 'true',
        WASENDER_API_KEY: 'session-test-key',
        WASENDER_API_URL: 'https://www.wasenderapi.com/api'
      }
    }
  );

  assert.equal(result.success, true);
  assert.equal(requests[0][0], 'https://www.wasenderapi.com/api/send-message');
  assert.deepEqual(requests[0][1], {
    to: '+2250700000000',
    text: 'Votre colis est en route'
  });
  assert.equal(requests[0][2].headers.Authorization, 'Bearer session-test-key');
  assert.equal(logs[0].provider, 'WaSenderAPI');
  assert.equal(logs[0].status, 'SENT');
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
