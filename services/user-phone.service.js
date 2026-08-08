import { cleanPhoneNumber, isValidIvorianPhone } from '../utils/phone.util.js';

export class UserPhoneValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserPhoneValidationError';
  }
}

export function normalizeUserPhone(value, options = {}) {
  const required = options.required === true;
  const rawPhone = String(value ?? '').trim();

  if (!rawPhone) {
    if (required) {
      throw new UserPhoneValidationError('Le numéro de téléphone est obligatoire.');
    }
    return null;
  }

  const normalizedPhone = cleanPhoneNumber(rawPhone);
  if (!isValidIvorianPhone(normalizedPhone)) {
    throw new UserPhoneValidationError(
      'Numéro de téléphone invalide. Utilisez par exemple 0712345678.'
    );
  }

  return normalizedPhone;
}
