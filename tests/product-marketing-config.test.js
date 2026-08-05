import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProductMarketingConfig,
  DEFAULT_PRODUCT_MARKETING_TEMPLATES
} from '../routes/product.routes.js';

test('désactive le Marketing par défaut sur un nouveau produit sans tunnel', () => {
  const config = buildProductMarketingConfig();

  assert.equal(config.marketingEnabled, false);
  assert.equal(config.marketingFunnelUrl, null);
  assert.equal(config.marketingTemplateJ3, DEFAULT_PRODUCT_MARKETING_TEMPLATES.marketingTemplateJ3);
});

test('refuse une activation produit sans lien de tunnel', () => {
  assert.throws(
    () => buildProductMarketingConfig({ marketingEnabled: true }),
    /Ajoutez le lien du tunnel/
  );
});

test('modifie le texte d’un produit sans muter la configuration d’un autre', () => {
  const productA = buildProductMarketingConfig({
    marketingEnabled: true,
    marketingFunnelUrl: 'https://example.com/a'
  });
  const productB = buildProductMarketingConfig({
    marketingEnabled: true,
    marketingFunnelUrl: 'https://example.com/b'
  });

  const updatedProductA = buildProductMarketingConfig(
    { marketingTemplateJ3: 'Message propre au produit A' },
    productA
  );

  assert.equal(updatedProductA.marketingTemplateJ3, 'Message propre au produit A');
  assert.equal(productB.marketingTemplateJ3, DEFAULT_PRODUCT_MARKETING_TEMPLATES.marketingTemplateJ3);
});
