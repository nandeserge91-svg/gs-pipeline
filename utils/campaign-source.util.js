const TAG_SUFFIX_PATTERN = /-(TIK|TIKTOK|FB|FACEBOOK|RET|RETARGETING)$/i;

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
    if (/^TIK(?:TOK)?$/i.test(suffixMatch[1])) {
      campaignSource = 'TikTok Ads';
    } else if (/^RET(?:ARGETING)?$/i.test(suffixMatch[1])) {
      campaignSource = 'Facebook Retargeting';
    } else {
      campaignSource = 'Facebook Ads';
    }
  }

  // Règle métier : sans balise TikTok ou Retargeting, la commande reste Facebook normal.
  if (!campaignSource) {
    campaignSource = 'Facebook Ads';
  }

  return { originalTag, productKey, campaignSource };
}

export function classifyOrderTrafficSource({ campaignSource, sourcePage }) {
  const campaign = String(campaignSource || '').toLowerCase();
  const page = String(sourcePage || '').toLowerCase();

  if (campaign.includes('retarget') || /-(?:ret|retargeting)\/?$/.test(page)) {
    return 'retargeting';
  }

  if (campaign.includes('tiktok') || /-(?:tik|tiktk|tiktok)$/.test(page)) {
    return 'tiktok';
  }

  // Toute commande sans balise spécifique est Facebook normal,
  // y compris les anciennes commandes sans source enregistrée.
  return 'facebook';
}
