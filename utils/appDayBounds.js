/**
 * Journées calendaires en Africa/Abidjan (GMT, sans heure d'été).
 * Les bornes sont des instants UTC stockés en Date (PostgreSQL / Prisma).
 * Évite new Date('YYYY-MM-DD') + setHours() qui dépend du fuseau du serveur Node.
 */

export const APP_TIMEZONE = 'Africa/Abidjan';

const ymdInAppTz = new Intl.DateTimeFormat('en-CA', {
  timeZone: APP_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @param {string} yyyyMmDd - ex. "2026-03-31"
 * @returns {Date | null} Début de journée 00:00:00.000 (Abidjan = UTC)
 */
export function startOfAppDay(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== 'string' || !YMD_RE.test(yyyyMmDd.trim())) {
    return null;
  }
  const [y, m, d] = yyyyMmDd.trim().split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

/**
 * @param {string} yyyyMmDd
 * @returns {Date | null} Fin de journée 23:59:59.999 (Abidjan = UTC)
 */
export function endOfAppDay(yyyyMmDd) {
  if (!yyyyMmDd || typeof yyyyMmDd !== 'string' || !YMD_RE.test(yyyyMmDd.trim())) {
    return null;
  }
  const [y, m, d] = yyyyMmDd.trim().split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 23, 59, 59, 999));
}

/** Date du jour calendaire actuel à Abidjan, format YYYY-MM-DD */
export function formatYmdInAppTz(date = new Date()) {
  return ymdInAppTz.format(date);
}

/** Minuit Abidjan du jour courant (pour "aujourd'hui" métier) */
export function startOfTodayAppDay() {
  return startOfAppDay(formatYmdInAppTz(new Date()));
}

export function endOfTodayAppDay() {
  return endOfAppDay(formatYmdInAppTz(new Date()));
}

/**
 * Fin exclusive : premier instant du jour suivant (pour filtres [gte, lt[).
 * @param {string} yyyyMmDd
 */
export function startOfNextAppDay(yyyyMmDd) {
  const start = startOfAppDay(yyyyMmDd);
  if (!start) return null;
  return new Date(Date.UTC(
    start.getUTCFullYear(),
    start.getUTCMonth(),
    start.getUTCDate() + 1,
    0, 0, 0, 0
  ));
}
