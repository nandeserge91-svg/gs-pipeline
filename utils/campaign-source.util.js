const TAG_SUFFIX_PATTERN = /-(TIK|TIKTOK|FB|FACEBOOK)$/i;

/**
 * Sépare la balise publicitaire du code produit utilisé pour le stock.
 * Exemple : SCARGEL-TIK reste traçable comme TikTok, mais recherche SCARGEL.
 */
export function parseTaggedProductSource(value) {
  const originalTag = typeof value === 'string' ? value.trim() : '';
  const suffixMatch = originalTag.match(TAG_SUFFIX_PATTERN);
  let productKey = originalTag;
  let campaignSource = null;

  if (suffixMatch) {
    productKey = originalTag.slice(0, -suffixMatch[0].length).trim();
    campaignSource = /^TIK(?:TOK)?$/i.test(suffixMatch[1])
      ? 'TikTok Ads'
      : 'Facebook Ads';
  }

  // Le tunnel Scar Gel historique, sans suffixe, est le tunnel Facebook.
  if (!campaignSource && productKey.toUpperCase() === 'SCARGEL') {
    campaignSource = 'Facebook Ads';
  }

  return { originalTag, productKey, campaignSource };
}

export function classifyOrderTrafficSource({ campaignSource, sourcePage, productCode }) {
  const campaign = String(campaignSource || '').toLowerCase();
  const page = String(sourcePage || '').toLowerCase();

  if (campaign.includes('tiktok') || /-tik(?:tok)?$/.test(page)) {
    return 'tiktok';
  }

  if (campaign.includes('facebook') || /-(?:fb|facebook)$/.test(page)) {
    return 'facebook';
  }

  // Toutes les anciennes commandes SCARGEL venaient du tunnel Facebook.
  if (String(productCode || '').toUpperCase() === 'SCARGEL') {
    return 'facebook';
  }

  return 'other';
}
