// Loads the JSON inventory and resolves references between projects, providers and tasks.
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
  const [projects, providers, maintenance] = await Promise.all([
    fetchJson('projects.json'),
    fetchJson('providers.json'),
    fetchJson('maintenance.json'),
  ]);
  return buildInventory(projects, providers, maintenance);
}

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);

export function buildInventory(projectsDoc, providersDoc, maintenanceDoc) {
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
      status: str(p.status),
      type: str(p.type),
      environment: str(p.environment),
      repository: str(p.repository),
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
          };
        }),
    }));
  const projectById = new Map(projects.map((p) => [p.id, p]));

  for (const project of projects) {
    for (const s of project.services) {
      if (s.providerRef && !s.providerRef.projects.includes(project)) s.providerRef.projects.push(project);
    }
  }

  const tasks = arr(maintenanceDoc?.tasks)
    .filter((t) => t && str(t.id) && str(t.title))
    .map((t) => {
      const refs = (ids, map, kind) =>
        arr(ids)
          .map((id) => {
            if (!map.has(id)) warnings.push(`Task "${t.id}" references unknown ${kind} "${id}".`);
            return map.get(id) ?? null;
          })
          .filter(Boolean);
      return {
        id: t.id,
        title: t.title,
        cadence: str(t.cadence),
        due: str(t.due),
        notes: str(t.notes),
        providers: refs(t.providers, providerById, 'provider'),
        projects: refs(t.projects, projectById, 'project'),
      };
    });

  const dates = [projectsDoc, providersDoc, maintenanceDoc].map((d) => d?.updated).filter(Boolean).sort();

  return {
    projects,
    providers,
    tasks,
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
