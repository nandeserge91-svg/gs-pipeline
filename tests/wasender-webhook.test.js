import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyWasenderStatusUpdate,
  isValidWasenderSignature,
  parseWasenderStatusUpdate
} from '../routes/wasender-webhook.routes.js';

test('vérifie exactement la signature du webhook', () => {
  assert.equal(isValidWasenderSignature('secret-test', 'secret-test'), true);
  assert.equal(isValidWasenderSignature('mauvais', 'secret-test'), false);
  assert.equal(isValidWasenderSignature('', 'secret-test'), false);
});

test('traduit les statuts WaSender en livré et lu', () => {
  const delivered = parseWasenderStatusUpdate({
    event: 'messages.update',
    data: { key: { id: 'message-42' }, update: { status: 3 } }
  });
  const read = parseWasenderStatusUpdate({
    event: 'messages.update',
    data: { key: { id: 'message-42' }, update: { status: 4 } }
  });

  assert.equal(delivered.status, 'DELIVERED');
  assert.equal(read.status, 'READ');
});

test('met à jour le journal correspondant sans rétrograder son statut', async () => {
  const writes = [];
  const db = {
    smsLog: {
      findFirst: async () => ({ id: 8, status: 'SENT' }),
      update: async mutation => writes.push(mutation)
    }
  };
  const now = new Date('2026-08-06T12:00:00.000Z');

  const result = await applyWasenderStatusUpdate(db, {
    providerId: 'message-42',
    status: 'DELIVERED',
    providerStatus: 'messages.update:3'
  }, now);

  assert.equal(result.updated, true);
  assert.equal(writes[0].where.id, 8);
  assert.equal(writes[0].data.status, 'DELIVERED');
  assert.equal(writes[0].data.deliveredAt, now);
});
