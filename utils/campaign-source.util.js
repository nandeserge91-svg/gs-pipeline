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

  // Règle métier : toute commande sans balise TikTok vient de Facebook.
  if (!campaignSource) {
    campaignSource = 'Facebook Ads';
  }

  return { originalTag, productKey, campaignSource };
}

export function classifyOrderTrafficSource({ campaignSource, sourcePage }) {
  const campaign = String(campaignSource || '').toLowerCase();
  const page = String(sourcePage || '').toLowerCase();

  if (campaign.includes('tiktok') || /-(?:tik|tiktk|tiktok)$/.test(page)) {
    return 'tiktok';
  }

  // Toute commande qui n'est pas explicitement TikTok est Facebook,
  // y compris les anciennes commandes sans source enregistrée.
  return 'facebook';
}
