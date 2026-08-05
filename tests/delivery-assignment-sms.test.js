import test from 'node:test';
import assert from 'node:assert/strict';

import {
  getDelivererDisplayName,
  notifyClientOfDeliveryAssignment,
  notifyClientsOfDeliveryAssignment
} from '../services/delivery-assignment-sms.service.js';

const enabledEnv = {
  SMS_ENABLED: 'true',
  SMS_DELIVERY_ASSIGNED: 'true'
};

const silentLogger = {
  log() {},
  warn() {},
  error() {}
};

const order = {
  id: 42,
  orderReference: 'CMD-42',
  clientNom: 'Awa Koné',
  clientTelephone: '+2250102030405',
  delivererId: null
};

const deliverer = {
  id: 7,
  prenom: 'Jean',
  nom: 'Kouassi',
  telephone: '+2250708091011'
};

test('compose le nom complet du livreur', () => {
  assert.equal(getDelivererDisplayName(deliverer), 'Jean Kouassi');
});

test('envoie au client le nom et le contact du livreur', async () => {
  let generatedVariables;
  let sentPayload;

  const result = await notifyClientOfDeliveryAssignment(
    { order, deliverer, userId: 3 },
    {
      env: enabledEnv,
      logger: silentLogger,
      templates: {
        deliveryAssigned: async (clientName, delivererName, delivererPhone) => {
          generatedVariables = { clientName, delivererName, delivererPhone };
          return `Livreur ${delivererName}, contact ${delivererPhone}`;
        }
      },
      sendSms: async (phone, message, metadata) => {
        sentPayload = { phone, message, metadata };
        return { success: true, smsLogId: 99 };
      }
    }
  );

  assert.equal(result.success, true);
  assert.deepEqual(generatedVariables, {
    clientName: 'Awa Koné',
    delivererName: 'Jean Kouassi',
    delivererPhone: '+2250708091011'
  });
  assert.deepEqual(sentPayload, {
    phone: '+2250102030405',
    message: 'Livreur Jean Kouassi, contact +2250708091011',
    metadata: {
      orderId: 42,
      type: 'DELIVERY_ASSIGNED',
      userId: 3
    }
  });
});

test('n’envoie pas deux fois pour le même livreur', async () => {
  let calls = 0;
  const result = await notifyClientOfDeliveryAssignment(
    { order: { ...order, delivererId: 7 }, deliverer, userId: 3 },
    {
      env: enabledEnv,
      logger: silentLogger,
      sendSms: async () => {
        calls += 1;
        return { success: true };
      }
    }
  );

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'unchanged-deliverer');
  assert.equal(calls, 0);
});

test('ignore l’envoi quand le contact du livreur manque', async () => {
  const result = await notifyClientOfDeliveryAssignment(
    { order, deliverer: { ...deliverer, telephone: null }, userId: 3 },
    { env: enabledEnv, logger: silentLogger }
  );

  assert.equal(result.skipped, true);
  assert.equal(result.reason, 'missing-deliverer-contact');
});

test('résume les envois d’une attribution groupée', async () => {
  const summary = await notifyClientsOfDeliveryAssignment(
    {
      orders: [order, { ...order, id: 43, delivererId: 7 }],
      deliverer,
      userId: 3
    },
    {
      env: enabledEnv,
      logger: silentLogger,
      templates: { deliveryAssigned: async () => 'Message' },
      sendSms: async () => ({ success: true })
    }
  );

  assert.deepEqual(summary, { sent: 1, failed: 0, skipped: 1 });
});
