import cron from 'node-cron';
import { runExpressReminders } from '../services/express-reminder.service.js';

export const DEFAULT_EXPRESS_REMINDER_CRON = '30 8 * * *';

export function scheduleExpressReminderJobs() {
  if (process.env.EXPRESS_REMINDER_CRON_ENABLED === 'false') {
    console.log('Relances EXPRESS désactivées (EXPRESS_REMINDER_CRON_ENABLED=false)');
    return;
  }

  const timezone = process.env.EXPRESS_REMINDER_CRON_TZ || 'Africa/Abidjan';
  const cronExpression = process.env.EXPRESS_REMINDER_CRON || DEFAULT_EXPRESS_REMINDER_CRON;

  cron.schedule(
    cronExpression,
    async () => {
      try {
        const result = await runExpressReminders();
        if (!result.disabled) {
          console.log(
            `[Cron] Relances EXPRESS: ${result.smsSent} SMS, `
            + `${result.failed} échec(s), `
            + `${result.skipped} ignorée(s)`
          );
        }
      } catch (error) {
        console.error('[Cron] Erreur relances EXPRESS:', error.message);
      }
    },
    { timezone }
  );

  console.log(`Relances EXPRESS planifiées (${cronExpression}, TZ=${timezone})`);
}

export default { scheduleExpressReminderJobs };
