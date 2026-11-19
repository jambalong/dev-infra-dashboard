import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildInventory } from '../assets/js/data.js';
import { validate } from '../scripts/validate-data.mjs';

const read = async (n) => JSON.parse(await readFile(new URL(`../data/${n}.json`, import.meta.url), 'utf8'));
const load = async () => ({ projects: await read('projects'), providers: await read('providers'), maintenance: await read('maintenance') });
const clone = (o) => structuredClone(o);

test('shipped data passes validation', async () => {
  assert.deepEqual(validate(await load()), []);
});

test('shipped data has the expected projects and providers', async () => {
  const d = await load();
  assert.deepEqual(d.projects.projects.map((p) => p.id), ['personal-website', 'pangu-terminal', 'lunrfast', 'homebase']);
  assert.equal(d.providers.providers.length, 8);
});

test('project/provider relationships resolve both ways', async () => {
  const d = await load();
  const inv = buildInventory(d.projects, d.providers, d.maintenance);
  assert.deepEqual(inv.warnings, []);
  const neon = inv.providerById.get('neon');
  assert.deepEqual(neon.projects.map((p) => p.id), ['pangu-terminal', 'homebase']);
  const lunrfast = inv.projectById.get('lunrfast');
  assert.deepEqual(lunrfast.services.map((s) => s.provider), ['expo', 'github-pages', 'supabase', 'buttondown']);
  assert.equal(inv.projectById.get('homebase').status, 'planned');
});

test('all providers are recorded as free (owner-confirmed)', async () => {
  const d = await load();
  const inv = buildInventory(d.projects, d.providers, d.maintenance);
  assert.ok(inv.providers.every((p) => p.costInfo.state === 'free' && p.plan === 'Free'));
});

test('missing optional fields and dangling references do not throw', () => {
  const inv = buildInventory(
    { projects: [{ id: 'a', services: [{ provider: 'ghost' }] }, { id: 'b', name: 'B' }] },
    { providers: [{ id: 'p' }] },
    { tasks: [{ id: 't', title: 'T', providers: ['nope'] }] },
  );
  assert.equal(inv.projects.length, 2);
  assert.equal(inv.projectById.get('a').services[0].providerRef, null);
  assert.equal(inv.warnings.length, 2);
  assert.equal(inv.providers[0].costInfo.state, 'unknown');
});

test('empty or malformed documents yield an empty inventory', () => {
  const inv = buildInventory(null, {}, undefined);
  assert.deepEqual([inv.projects, inv.providers, inv.tasks], [[], [], []]);
});

test('validator catches broken references, enums and duplicate ids', async () => {
  const d = await load();
  d.projects.projects[0].services[0].provider = 'missing';
  d.projects.projects[1].status = 'weird';
  d.projects.projects[2].id = 'homebase';
  const errors = validate(d).join('\n');
  assert.match(errors, /unknown provider "missing"/);
  assert.match(errors, /"weird" is not one of/);
  assert.match(errors, /duplicate id "homebase"/);
});

test('validator requires billing for paid costs and rejects mixed currencies', async () => {
  const d = await load();
  d.providers.providers[0].cost = { amount: 5, currency: 'USD', billing: null };
  d.providers.providers[1].cost = { amount: 5, currency: 'EUR', billing: 'monthly' };
  const errors = validate(d).join('\n');
  assert.match(errors, /billing: required/);
  assert.match(errors, /differs from/);
});

test('validator blocks sensitive-looking content', async () => {
  for (const bad of ['postgres://user:pw@host/db', 'api_key = abc', 'host 10.0.0.12', 'ghp_abcdefghijklmnopqrstuvwxyz']) {
    const d = clone(await load());
    d.providers.providers[0].notes = [bad];
    assert.ok(validate(d).some((e) => /do not publish/.test(e)), bad);
  }
});

test('validator checks project icons exist and stay under assets/icons', async () => {
  const d = await load();
  d.projects.projects[0].icon = 'assets/icons/projects/missing.svg';
  d.projects.projects[1].icon = '../secrets.png';
  const errors = validate(d).join('\n');
  assert.match(errors, /file not found/);
  assert.match(errors, /relative path under assets\/icons/);
});

test('shipped projects with icons point at existing files', async () => {
  const d = await load();
  assert.deepEqual(d.projects.projects.filter((p) => p.icon).map((p) => p.id), ['personal-website', 'pangu-terminal', 'lunrfast']);
});
