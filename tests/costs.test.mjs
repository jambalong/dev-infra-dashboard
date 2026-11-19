import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCost, summarizeCosts, formatMoney } from '../assets/js/costs.js';

test('null amount is unknown, not zero', () => {
  const c = normalizeCost({ amount: null, billing: null });
  assert.equal(c.state, 'unknown');
  assert.equal(c.monthly, null);
});

test('missing cost object is unknown', () => {
  assert.equal(normalizeCost(undefined).state, 'unknown');
  assert.equal(normalizeCost(null).state, 'unknown');
});

test('zero is explicitly free', () => {
  const c = normalizeCost({ amount: 0 });
  assert.equal(c.state, 'free');
  assert.equal(c.monthly, 0);
});

test('annual costs convert to monthly equivalents', () => {
  const c = normalizeCost({ amount: 120, billing: 'annual' });
  assert.equal(c.monthly, 10);
  assert.equal(c.annual, 120);
});

test('monthly costs convert to annual', () => {
  assert.equal(normalizeCost({ amount: 7, billing: 'monthly' }).annual, 84);
});

test('amount without billing frequency stays unknown', () => {
  assert.equal(normalizeCost({ amount: 5 }).state, 'unknown');
});

test('invalid amounts are unknown', () => {
  assert.equal(normalizeCost({ amount: -1, billing: 'monthly' }).state, 'unknown');
  assert.equal(normalizeCost({ amount: '5', billing: 'monthly' }).state, 'unknown');
});

test('summary excludes unknown from totals and counts it separately', () => {
  const s = summarizeCosts([
    { cost: { amount: 10, billing: 'monthly' } },
    { cost: { amount: 0 } },
    { cost: { amount: null } },
    { cost: { amount: 120, billing: 'annual' } },
  ]);
  assert.deepEqual({ paid: s.paid, free: s.free, unknown: s.unknown, known: s.known }, { paid: 2, free: 1, unknown: 1, known: 3 });
  assert.equal(s.monthly, 20);
  assert.equal(s.annual, 240);
});

test('all-unknown summary has zero known', () => {
  const s = summarizeCosts([{ cost: { amount: null } }, { cost: null }]);
  assert.equal(s.known, 0);
  assert.equal(s.unknown, 2);
});

test('formatMoney', () => {
  assert.equal(formatMoney(null), '—');
  assert.equal(formatMoney(12.5), '$12.50');
});
