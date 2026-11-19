import { h, externalLink } from '../dom.js';
import { badge, emptyState, pageHeader, projectCard, serviceCost } from '../components.js';
import { ENVIRONMENTS, ROLES, STATUSES, TYPES, labelOf } from '../schema.js';
import { statusBadge } from '../components.js';

// Filter state survives navigation within the session.
const filters = { q: '', status: '', type: '' };

export function matchesProject(project, { q, status, type }) {
  if (status && project.status !== status) return false;
  if (type && project.type !== type) return false;
  if (!q) return true;
  const haystack = [
    project.name,
    project.description,
    labelOf(TYPES, project.type),
    ...project.services.flatMap((s) => [s.providerRef?.name ?? s.provider, s.label]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

function select(id, label, options, value, onchange) {
  return h(
    'label',
    { class: 'field', for: id },
    h('span', { class: 'sr-only' }, label),
    h(
      'select',
      { id, onchange: (e) => onchange(e.target.value) },
      h('option', { value: '' }, label),
      Object.entries(options).map(([k, v]) => h('option', { value: k, selected: k === value }, v)),
    ),
  );
}

export function renderProjects({ inv }) {
  const results = h('div', { class: 'grid' });
  const count = h('p', { class: 'muted summary-line', 'aria-live': 'polite' });

  const draw = () => {
    const list = inv.projects.filter((p) => matchesProject(p, filters));
    count.textContent = `${list.length} of ${inv.projects.length} projects`;
    results.replaceChildren(...(list.length ? list.map(projectCard) : [emptyState('No projects match your filters.')]));
  };

  // Only offer values that actually appear in the data, plus any unrecognised ones.
  const present = (key, labels) => Object.fromEntries([...new Set(inv.projects.map((p) => p[key]).filter(Boolean))].map((v) => [v, labelOf(labels, v)]));

  const search = h('input', {
    type: 'search',
    class: 'search',
    placeholder: 'Search projects, providers…',
    'aria-label': 'Search projects',
    value: filters.q,
    oninput: (e) => {
      filters.q = e.target.value.trim();
      draw();
    },
  });

  const root = h(
    'div',
    null,
    pageHeader('Projects', 'Every project and the services it runs on.'),
    h(
      'div',
      { class: 'toolbar' },
      search,
      select('f-status', 'All statuses', present('status', STATUSES), filters.status, (v) => ((filters.status = v), draw())),
      select('f-type', 'All types', present('type', TYPES), filters.type, (v) => ((filters.type = v), draw())),
    ),
    count,
    results,
  );
  draw();
  return root;
}

export function renderProjectDetail(ctx, id) {
  const { inv } = ctx;
  const project = inv.projectById.get(id);
  const back = h('a', { href: '#/projects', class: 'back' }, '← All projects');
  if (!project) {
    return h('div', null, back, pageHeader('Project not found', `No project with id “${id}”.`));
  }

  const repo = project.repository ? externalLink(project.repository) : h('span', { class: 'muted' }, 'Not set');
  const meta = [
    ['Status', statusBadge(project.status)],
    ['Type', labelOf(TYPES, project.type)],
    ['Environment', labelOf(ENVIRONMENTS, project.environment)],
    ['Website', project.website ? externalLink(project.website) : h('span', { class: 'muted' }, 'Not set')],
    project.repository ? ['Repository', repo] : null,
  ].filter(Boolean);

  const servicesTable = project.services.length
    ? h(
        'div',
        { class: 'table-wrap' },
        h(
          'table',
          null,
          h('thead', null, h('tr', null, ['Role', 'Provider', 'Detail', 'State', 'Plan', 'Cost'].map((t) => h('th', { scope: 'col' }, t)))),
          h(
            'tbody',
            null,
            project.services.map((s) =>
              h(
                'tr',
                null,
                h('td', null, labelOf(ROLES, s.role)),
                h('td', null, s.providerRef ? s.providerRef.name : h('span', { class: 'muted' }, `${s.provider} (not found)`)),
                h('td', null, s.label ?? h('span', { class: 'muted' }, '—')),
                h('td', null, s.state === 'planned' ? badge('Planned', 'blue') : badge('Active', 'green')),
                h('td', null, s.providerRef?.plan ?? h('span', { class: 'muted' }, 'Unknown')),
                h('td', null, serviceCost(s)),
              ),
            ),
          ),
        ),
      )
    : emptyState('No services recorded for this project.');

  return h(
    'div',
    null,
    back,
    pageHeader(project.name, project.description ?? 'No description.'),
    h('section', { class: 'card' }, h('dl', { class: 'meta' }, meta.map(([k, v]) => h('div', { class: 'kv' }, h('dt', null, k), h('dd', null, v))))),
    h('section', { class: 'card' }, h('h2', null, 'Services'), servicesTable),
    project.notes.length ? h('section', { class: 'card' }, h('h2', null, 'Notes'), h('ul', { class: 'notes' }, project.notes.map((n) => h('li', null, n)))) : null,
  );
}
