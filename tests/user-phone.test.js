import test from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeUserPhone,
  UserPhoneValidationError,
} from '../services/user-phone.service.js';

test('normalise un numéro ivoirien saisi au format local', () => {
  assert.equal(normalizeUserPhone('07 12 34 56 78', { required: true }), '+2250712345678');
});

test('refuse un compte créé sans téléphone', () => {
  assert.throws(
    () => normalizeUserPhone('', { required: true }),
    (error) => error instanceof UserPhoneValidationError
      && error.message === 'Le numéro de téléphone est obligatoire.'
  );
});

test('refuse une valeur qui ne correspond pas à un téléphone', () => {
  assert.throws(
    () => normalizeUserPhone('nandeserge91@gmail.com', { required: true }),
    (error) => error instanceof UserPhoneValidationError
      && error.message.includes('Numéro de téléphone invalide')
  );
});

test('autorise une valeur vide seulement lorsqu’elle est facultative', () => {
  assert.equal(normalizeUserPhone('', { required: false }), null);
});
