import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assertUserUpdateAllowed,
  UserManagementPermissionError,
} from '../services/user-management-permissions.service.js';

test('autorise le Gestionnaire principal à modifier le téléphone d’un livreur', () => {
  assert.doesNotThrow(() => {
    assertUserUpdateAllowed('GESTIONNAIRE', 'LIVREUR', { telephone: '0712345678' });
  });
});

test('refuse au Gestionnaire principal la modification d’un autre rôle', () => {
  assert.throws(
    () => assertUserUpdateAllowed('GESTIONNAIRE', 'APPELANT', { telephone: '0712345678' }),
    UserManagementPermissionError
  );
});

test('refuse au Gestionnaire principal de changer les autres données du livreur', () => {
  assert.throws(
    () => assertUserUpdateAllowed('GESTIONNAIRE', 'LIVREUR', {
      telephone: '0712345678',
      role: 'ADMIN',
    }),
    UserManagementPermissionError
  );
});

test('conserve l’accès complet de l’administrateur', () => {
  assert.doesNotThrow(() => {
    assertUserUpdateAllowed('ADMIN', 'GESTIONNAIRE', { role: 'APPELANT', actif: false });
  });
});
