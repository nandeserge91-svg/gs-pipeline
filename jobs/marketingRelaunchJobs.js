import cron from 'node-cron';
import { runMarketingRelaunches } from '../services/marketing-relaunch.service.js';

export function scheduleMarketingRelaunchJobs() {
  if (process.env.MARKETING_RELAUNCH_CRON_ENABLED === 'false') {
    console.log('⏸️  Relances marketing désactivées (MARKETING_RELAUNCH_CRON_ENABLED=false)');
    return;
  }

  const timezone = process.env.MARKETING_RELAUNCH_CRON_TZ || 'Africa/Abidjan';
  const cronExpression = process.env.MARKETING_RELAUNCH_CRON || '15 * * * *';

  cron.schedule(
    cronExpression,
    async () => {
      try {
        const result = await runMarketingRelaunches();

        if (!result.disabled) {
          console.log(
            `📣 [Cron] Relances marketing: ${result.sent} envoyée(s), `
            + `${result.failed} échec(s), ${result.blocked} sans lien, ${result.skipped} ignorée(s)`
          );
        }
      } catch (error) {
        console.error('❌ [Cron] Erreur relances marketing:', error.message);
      }
    },
    { timezone }
  );

  console.log(`✅ Relances marketing planifiées (${cronExpression}, TZ=${timezone})`);
}

export default { scheduleMarketingRelaunchJobs };
