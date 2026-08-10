import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSmsDeviceParam,
  formatSmsDisplayPhone,
  generateSmsFromTemplate,
  makeSmsCarrierSafe,
  parseSms8Response
} from '../services/sms.service.js';

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

test('rend un texte Marketing propre au produit sans charger le modèle global', async () => {
  const message = await generateSmsFromTemplate(
    'MARKETING_RELANCE_J3',
    { prenom: 'Awa', produit: 'Produit A', lien: 'https://example.com/a' },
    'Bonjour {prenom}, offre {produit}: {lien}'
  );

  assert.equal(message, 'Bonjour Awa, offre Produit A https://example.com/a');
});

test('retire les deux-points sans casser les liens', () => {
  assert.equal(
    makeSmsCarrierSafe('AFGestion : offre ici : https://example.com/a'),
    'AFGestion offre ici https://example.com/a'
  );
});

test('espace le contact du livreur uniquement dans le message', () => {
  assert.equal(formatSmsDisplayPhone('+2250708091011'), '07 08 09 10 11');
  assert.equal(formatSmsDisplayPhone('0506070809'), '05 06 07 08 09');
});
