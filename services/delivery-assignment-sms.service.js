import { sendSMS, smsTemplates } from './sms.service.js';

export function getDelivererDisplayName(deliverer = {}) {
  return [deliverer.prenom, deliverer.nom]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ');
}

export async function notifyClientOfDeliveryAssignment(
  { order, deliverer, userId },
  dependencies = {}
) {
  const sendSms = dependencies.sendSms || sendSMS;
  const templates = dependencies.templates || smsTemplates;
  const env = dependencies.env || process.env;
  const logger = dependencies.logger || console;

  if (env.SMS_ENABLED !== 'true' || env.SMS_DELIVERY_ASSIGNED !== 'true') {
    return { success: false, skipped: true, reason: 'disabled' };
  }

  if (Number(order.delivererId) === Number(deliverer.id)) {
    return { success: false, skipped: true, reason: 'unchanged-deliverer' };
  }

  const clientPhone = String(order.clientTelephone || '').trim();
  const delivererPhone = String(deliverer.telephone || '').trim();
  const delivererName = getDelivererDisplayName(deliverer);

  if (!clientPhone) {
    logger.warn(`SMS DELIVERY_ASSIGNED ignoré pour ${order.orderReference}: téléphone client manquant`);
    return { success: false, skipped: true, reason: 'missing-client-phone' };
  }

  if (!delivererName || !delivererPhone) {
    logger.warn(`SMS DELIVERY_ASSIGNED ignoré pour ${order.orderReference}: coordonnées livreur incomplètes`);
    return { success: false, skipped: true, reason: 'missing-deliverer-contact' };
  }

  try {
    const message = await templates.deliveryAssigned(
      order.clientNom || 'Client',
      delivererName,
      delivererPhone
    );

    const result = await sendSms(clientPhone, message, {
      orderId: order.id,
      type: 'DELIVERY_ASSIGNED',
      userId
    });

    if (result.success) {
      logger.log(`SMS DELIVERY_ASSIGNED envoyé pour commande ${order.orderReference}`);
    } else {
      logger.error(`Échec SMS DELIVERY_ASSIGNED pour commande ${order.orderReference}: ${result.error}`);
    }

    return { ...result, skipped: false };
  } catch (error) {
    logger.error(`Erreur SMS DELIVERY_ASSIGNED pour commande ${order.orderReference}: ${error.message}`);
    return { success: false, skipped: false, error: error.message };
  }
}

export async function notifyClientsOfDeliveryAssignment(
  { orders, deliverer, userId },
  dependencies = {}
) {
  const results = await Promise.all(
    orders.map((order) => notifyClientOfDeliveryAssignment(
      { order, deliverer, userId },
      dependencies
    ))
  );

  return results.reduce((summary, result) => {
    if (result.skipped) summary.skipped += 1;
    else if (result.success) summary.sent += 1;
    else summary.failed += 1;
    return summary;
  }, { sent: 0, failed: 0, skipped: 0 });
}
