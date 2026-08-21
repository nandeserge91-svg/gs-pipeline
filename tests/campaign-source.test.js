import test from 'node:test';
import assert from 'node:assert/strict';

import {
  classifyOrderTrafficSource,
  parseTaggedProductSource,
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
  assert.equal(classifyOrderTrafficSource({ productCode: 'SCARGEL' }), 'facebook');
  assert.equal(classifyOrderTrafficSource({ campaignSource: 'Google Sheet - Bee Venom' }), 'facebook');
});
