import test from 'node:test';
import assert from 'node:assert/strict';

import { buildSmsDeviceParam, parseSms8Response } from '../services/sms.service.js';

test('sélectionne SIM 1 par son emplacement, sans numéro de SIM', () => {
  assert.equal(buildSmsDeviceParam('12286', '0'), '12286|0');
});

test('refuse un emplacement SIM invalide', () => {
  assert.throws(
    () => buildSmsDeviceParam('12286', '2'),
    /SMS_SIM_SLOT doit être 0 \(SIM 1\) ou 1 \(SIM 2\)/
  );
});

test('accepte une réponse SMS8 mise en file', () => {
  const result = parseSms8Response({
    success: true,
    data: { messages: [{ ID: 123, status: 'Queued' }] }
  });

  assert.equal(result.isSuccess, true);
  assert.equal(result.providerError, null);
});

test('remonte l’expiration de l’abonnement SMS8', () => {
  const result = parseSms8Response({
    success: false,
    error: { message: 'Your subscription has expired.' },
    data: { messages: [] }
  });

  assert.equal(result.isSuccess, false);
  assert.equal(result.providerError, 'Your subscription has expired.');
});

test('refuse un message marqué Failed par SMS8', () => {
  const result = parseSms8Response({
    success: true,
    data: { messages: [{ status: 'Failed', message: 'Device offline' }] }
  });

  assert.equal(result.isSuccess, false);
  assert.equal(result.providerError, 'Device offline');
});
