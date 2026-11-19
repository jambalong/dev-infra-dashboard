// Loads the JSON inventory and resolves references between projects and providers.
// buildInventory() is pure so it can be tested in Node; loadInventory() uses fetch.

import { normalizeCost } from './costs.js';

// Resolved relative to this module (assets/js/), so it works under any GitHub Pages subpath.
const DATA_URL = new URL('../../data/', import.meta.url);

async function fetchJson(name) {
  const res = await fetch(new URL(name, DATA_URL), { cache: 'no-cache' });
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  return res.json();
}

export async function loadInventory() {
  const [projects, providers] = await Promise.all([
    fetchJson('projects.json'),
    fetchJson('providers.json'),
  ]);
  return buildInventory(projects, providers);
}

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function buildInventory(projectsDoc, providersDoc) {
  const warnings = [];

  const providers = arr(providersDoc?.providers)
    .filter((p) => p && str(p.id))
    .map((p) => ({
      id: p.id,
      name: str(p.name) ?? p.id,
      category: str(p.category),
      website: str(p.website),
      plan: str(p.plan),
      cost: p.cost ?? null,
      costInfo: normalizeCost(p.cost),
      currency: p.cost?.currency ?? 'USD',
      freeTier: str(p.freeTier),
      notes: arr(p.notes).filter(str),
      projects: [], // derived below
    }));
  const providerById = new Map(providers.map((p) => [p.id, p]));

  const projects = arr(projectsDoc?.projects)
    .filter((p) => p && str(p.id))
    .map((p) => ({
      id: p.id,
      name: str(p.name) ?? p.id,
      description: str(p.description),
      icon: str(p.icon),
      status: str(p.status),
      type: str(p.type),
      environment: str(p.environment),
      repository: str(p.repository),
      website: str(p.website),
      notes: arr(p.notes).filter(str),
      services: arr(p.services)
        .filter((s) => s && str(s.provider))
        .map((s) => {
          const providerRef = providerById.get(s.provider) ?? null;
          if (!providerRef) warnings.push(`Project "${p.id}" references unknown provider "${s.provider}".`);
          return {
            role: str(s.role) ?? 'hosting',
            provider: s.provider,
            providerRef,
            label: str(s.label),
            state: str(s.state) ?? 'active',
            costInfo: normalizeCost(s.cost),
            currency: s.cost?.currency ?? 'USD',
          };
        }),
    }));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  // A provider with no plan-level cost takes its cost from the priced services that use it
  // (e.g. a registrar billed per domain). Annual total; services without a cost add nothing,
  // so a shared item is only counted once.
  for (const provider of providers) {
    if (provider.costInfo.state !== 'unknown') continue;
    const priced = projects.flatMap((p) => p.services).filter((s) => s.providerRef === provider && s.costInfo.state !== 'unknown');
    if (!priced.length) continue;
    const annual = Math.round(priced.reduce((sum, s) => sum + s.costInfo.annual, 0) * 100) / 100;
    provider.costInfo = normalizeCost({ amount: annual, billing: 'annual' });
    provider.currency = priced[0].currency;
    provider.costDerived = true;
  }

  for (const project of projects) {
    for (const s of project.services) {
      if (s.providerRef && !s.providerRef.projects.includes(project)) s.providerRef.projects.push(project);
    }
  }

  const dates = [projectsDoc, providersDoc].map((d) => d?.updated).filter(Boolean).sort();

  return {
    projects,
    providers,
    projectById,
    providerById,
    warnings,
    updated: dates.at(-1) ?? null,
  };
}

/** Services of a project with the given role. */
export function servicesByRole(project, role) {
  return project.services.filter((s) => s.role === role);
}
