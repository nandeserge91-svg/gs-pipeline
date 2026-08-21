import test from 'node:test';
import assert from 'node:assert/strict';

import {
  applyRetargetingDiscount,
  classifyOrderTrafficSource,
  parseTaggedProductSource,
  RETARGETING_DISCOUNT_AMOUNT,
} from '../utils/campaign-source.util.js';

test('SCARGEL-TIK utilise le produit SCARGEL et conserve la source TikTok', () => {
  assert.deepEqual(parseTaggedProductSource('SCARGEL-TIK'), {
    originalTag: 'SCARGEL-TIK',
    productKey: 'SCARGEL',
    campaignSource: 'TikTok Ads',
  });
});

test('SCARGEL sans suffixe reste le produit Facebook historique', () => {
  assert.deepEqual(parseTaggedProductSource('ScarGel'), {
    originalTag: 'ScarGel',
    productKey: 'ScarGel',
    campaignSource: 'Facebook Ads',
  });
});

test('SCARGEL-RET utilise SCARGEL et conserve la source Facebook Retargeting', () => {
  assert.deepEqual(parseTaggedProductSource('SCARGEL-RET'), {
    originalTag: 'SCARGEL-RET',
    productKey: 'SCARGEL',
    campaignSource: 'Facebook Retargeting',
  });
});

test('les produits sans balise TikTok ou Retargeting restent Facebook', () => {
  assert.deepEqual(parseTaggedProductSource('BODYFLEX'), {
    originalTag: 'BODYFLEX',
    productKey: 'BODYFLEX',
    campaignSource: 'Facebook Ads',
  });
});

test('les statistiques reconnaissent TikTok, Facebook normal et Retargeting', () => {
  assert.equal(classifyOrderTrafficSource({ campaignSource: 'TikTok Ads' }), 'tiktok');
  assert.equal(classifyOrderTrafficSource({ sourcePage: 'SCARGEL-TIK' }), 'tiktok');
  assert.equal(classifyOrderTrafficSource({ campaignSource: 'Facebook Retargeting' }), 'retargeting');
  assert.equal(classifyOrderTrafficSource({ sourcePage: 'SCARGEL-RET' }), 'retargeting');
  assert.equal(classifyOrderTrafficSource({ sourcePage: 'africastoresh.site/scar-gel-ret/' }), 'retargeting');
  assert.equal(classifyOrderTrafficSource({ sourcePage: 'africastoresh.site/scar-gel-ret/?utm_source=facebook' }), 'retargeting');
  assert.equal(classifyOrderTrafficSource({ productCode: 'SCARGEL' }), 'facebook');
  assert.equal(classifyOrderTrafficSource({ campaignSource: 'Google Sheet - Bee Venom' }), 'facebook');
});

test('la balise Retargeting retire 1 000 F du montant total', () => {
  assert.equal(RETARGETING_DISCOUNT_AMOUNT, 1000);
  assert.equal(applyRetargetingDiscount(9900, 'Facebook Retargeting'), 8900);
  assert.equal(applyRetargetingDiscount(18000, 'Facebook Retargeting'), 17000);
});

test('les commandes Facebook normales et TikTok gardent leur prix', () => {
  assert.equal(applyRetargetingDiscount(9900, 'Facebook Ads'), 9900);
  assert.equal(applyRetargetingDiscount(9900, 'TikTok Ads'), 9900);
});

test('la remise Retargeting ne peut pas produire un montant négatif', () => {
  assert.equal(applyRetargetingDiscount(500, 'Facebook Retargeting'), 0);
});
