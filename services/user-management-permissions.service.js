export class UserManagementPermissionError extends Error {
  constructor(message) {
    super(message);
    this.name = 'UserManagementPermissionError';
  }
}

const GESTIONNAIRE_FORBIDDEN_UPDATE_FIELDS = [
  'email',
  'nom',
  'prenom',
  'role',
  'actif',
  'password',
];

export function assertUserUpdateAllowed(actorRole, targetRole, changes = {}) {
  if (actorRole === 'ADMIN') return;

  if (actorRole !== 'GESTIONNAIRE' || targetRole !== 'LIVREUR') {
    throw new UserManagementPermissionError(
      'Le Gestionnaire principal peut modifier uniquement le numéro de téléphone des livreurs.'
    );
  }

  const forbiddenField = GESTIONNAIRE_FORBIDDEN_UPDATE_FIELDS.find(
    (field) => Object.prototype.hasOwnProperty.call(changes, field)
  );

  if (forbiddenField) {
    throw new UserManagementPermissionError(
      'Le Gestionnaire principal peut modifier uniquement le numéro de téléphone des livreurs.'
    );
  }
}
