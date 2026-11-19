// Validates the inventory JSON: structure, enums, cross-references and obviously sensitive content.
// Usage: node scripts/validate-data.mjs   (exits 1 on any error)

import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { BILLING, CATEGORIES, ENVIRONMENTS, ROLES, SERVICE_STATES, STATUSES, TYPES } from '../assets/js/schema.js';

const DATA_DIR = new URL('../data/', import.meta.url);
const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// Things that must never be published. Deliberately conservative.
const SENSITIVE = [
  [/\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]+@/i, 'URL with embedded credentials'],
  [/\b(postgres(ql)?|mysql|mongodb(\+srv)?|redis|amqp):\/\//i, 'database connection string'],
  [/\b(?:\d{1,3}\.){3}\d{1,3}\b/, 'IP address'],
  [/\b(api[_-]?key|secret|passw(or)?d|token|bearer)\b\s*[:=]/i, 'credential assignment'],
  [/\b(AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|github_pat_\w+|sk_(live|test)_\w+|xox[bap]-[\w-]+)\b/, 'API token'],
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'private key'],
];

export function validate({ projects, providers, maintenance }) {
  const errors = [];
  const err = (msg) => errors.push(msg);
  const isStr = (v) => typeof v === 'string' && v.trim() !== '';
  const oneOf = (v, map, where, { nullable = false } = {}) => {
    if (v == null && nullable) return;
    if (!(v in map)) err(`${where}: "${v}" is not one of ${Object.keys(map).join(', ')}`);
  };
  const httpUrl = (v, where) => {
    try {
      if (new URL(v).protocol !== 'https:') err(`${where}: must be an https:// URL`);
    } catch {
      err(`${where}: invalid URL "${v}"`);
    }
  };
  const ids = (list, where) => {
    const seen = new Set();
    for (const item of list) {
      if (!isStr(item?.id) || !ID.test(item.id)) err(`${where}: id "${item?.id}" must be lowercase-kebab-case`);
      else if (seen.has(item.id)) err(`${where}: duplicate id "${item.id}"`);
      else seen.add(item.id);
    }
    return seen;
  };

  for (const [name, doc, key] of [['projects.json', projects, 'projects'], ['providers.json', providers, 'providers'], ['maintenance.json', maintenance, 'tasks']]) {
    if (doc?.schemaVersion !== 1) err(`${name}: schemaVersion must be 1`);
    if (!Array.isArray(doc?.[key])) err(`${name}: "${key}" must be an array`);
  }
  if (errors.length) return errors;

  const providerIds = ids(providers.providers, 'providers.json');
  const projectIds = ids(projects.projects, 'projects.json');
  ids(maintenance.tasks, 'maintenance.json');

  let currency = null;
  for (const p of providers.providers) {
    const w = `providers.json[${p.id}]`;
    if (!isStr(p.name)) err(`${w}: name is required`);
    oneOf(p.category, CATEGORIES, `${w}.category`);
    if (p.website != null) httpUrl(p.website, `${w}.website`);
    if (p.cost != null) {
      const { amount, currency: cur, billing } = p.cost;
      if (amount !== null && (typeof amount !== 'number' || !(amount >= 0))) err(`${w}.cost.amount: must be null (unknown) or a number >= 0`);
      if (typeof amount === 'number' && amount > 0 && !(billing in BILLING)) err(`${w}.cost.billing: required (monthly|annual) when amount > 0`);
      if (billing != null) oneOf(billing, BILLING, `${w}.cost.billing`);
      if (cur != null) {
        if (!/^[A-Z]{3}$/.test(cur)) err(`${w}.cost.currency: must be a 3-letter code`);
        else if (currency && cur !== currency) err(`${w}.cost.currency: "${cur}" differs from "${currency}"; use one currency`);
        else currency = cur;
      }
    }
  }

  for (const p of projects.projects) {
    const w = `projects.json[${p.id}]`;
    if (!isStr(p.name)) err(`${w}: name is required`);
    oneOf(p.status, STATUSES, `${w}.status`);
    oneOf(p.type, TYPES, `${w}.type`, { nullable: true });
    oneOf(p.environment, ENVIRONMENTS, `${w}.environment`, { nullable: true });
    if (p.repository != null) httpUrl(p.repository, `${w}.repository`);
    if (p.website != null) httpUrl(p.website, `${w}.website`);
    if (p.icon != null) {
      if (!/^assets\/icons\/[\w./-]+\.(svg|png|ico|webp)$/.test(p.icon) || p.icon.includes('..')) err(`${w}.icon: must be a relative path under assets/icons/`);
      else if (!existsSync(new URL(`../${p.icon}`, import.meta.url))) err(`${w}.icon: file not found: ${p.icon}`);
    }
    if (!Array.isArray(p.services)) err(`${w}.services: must be an array`);
    for (const [i, s] of (p.services ?? []).entries()) {
      oneOf(s.role, ROLES, `${w}.services[${i}].role`);
      if (s.state != null) oneOf(s.state, SERVICE_STATES, `${w}.services[${i}].state`);
      if (!providerIds.has(s.provider)) err(`${w}.services[${i}]: unknown provider "${s.provider}"`);
    }
  }

  for (const t of maintenance.tasks) {
    const w = `maintenance.json[${t.id}]`;
    if (!isStr(t.title)) err(`${w}: title is required`);
    if (t.due != null && !/^\d{4}-\d{2}-\d{2}$/.test(t.due)) err(`${w}.due: must be YYYY-MM-DD or null`);
    for (const id of t.providers ?? []) if (!providerIds.has(id)) err(`${w}: unknown provider "${id}"`);
    for (const id of t.projects ?? []) if (!projectIds.has(id)) err(`${w}: unknown project "${id}"`);
  }

  // Public-safety scan over every string value.
  const scan = (value, path) => {
    if (typeof value === 'string') {
      for (const [re, what] of SENSITIVE) if (re.test(value)) err(`${path}: looks like a ${what}; do not publish it`);
    } else if (Array.isArray(value)) value.forEach((v, i) => scan(v, `${path}[${i}]`));
    else if (value && typeof value === 'object') for (const [k, v] of Object.entries(value)) scan(v, `${path}.${k}`);
  };
  scan({ projects, providers, maintenance }, 'data');

  return errors;
}

async function readDoc(name) {
  try {
    return JSON.parse(await readFile(new URL(name, DATA_DIR), 'utf8'));
  } catch (e) {
    throw new Error(`${name}: ${e.message}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const docs = { projects: await readDoc('projects.json'), providers: await readDoc('providers.json'), maintenance: await readDoc('maintenance.json') };
    const errors = validate(docs);
    if (errors.length) {
      console.error(`Data validation failed (${errors.length}):`);
      for (const e of errors) console.error(`  - ${e}`);
      process.exit(1);
    }
    console.log(`Data OK: ${docs.projects.projects.length} projects, ${docs.providers.providers.length} providers, ${docs.maintenance.tasks.length} tasks.`);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
