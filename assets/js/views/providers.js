import { h, externalLink } from '../dom.js';
import { billingLabel, costBadge, emptyState, monogram, pageHeader } from '../components.js';
import { CATEGORIES, ROLES, labelOf } from '../schema.js';

const filters = { q: '', category: '' };

export function matchesProvider(provider, { q, category }) {
  if (category && provider.category !== category) return false;
  if (!q) return true;
  const haystack = [provider.name, labelOf(CATEGORIES, provider.category), provider.plan, ...provider.projects.map((p) => p.name), ...provider.notes]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q.toLowerCase());
}

/** What this provider is used for, derived from project services (e.g. "Hosting · Database"). */
function usage(provider) {
  const rows = [];
  for (const project of provider.projects) {
    for (const s of project.services) {
      if (s.providerRef === provider) rows.push({ project, service: s });
    }
  }
  return rows;
}

function providerCard(provider) {
  const rows = usage(provider);
  const field = (label, content) => h('div', { class: 'kv' }, h('dt', null, label), h('dd', null, content));
  return h(
    'article',
    { class: 'card provider-card' },
    h(
      'div',
      { class: 'card-head' },
      h('div', { class: 'card-title' }, monogram(provider.name), h('h3', null, provider.name)),
      h('span', { class: 'badge badge-neutral' }, labelOf(CATEGORIES, provider.category)),
    ),
    h(
      'dl',
      { class: 'kvs' },
      field('Website', provider.website ? externalLink(provider.website) : h('span', { class: 'muted' }, '—')),
      field('Plan', provider.plan ?? h('span', { class: 'muted' }, 'Unknown')),
      field('Cost', [costBadge(provider), billingLabel(provider) === '—' ? null : h('span', { class: 'muted' }, ` · ${billingLabel(provider)}`)]),
      field('Free tier', provider.freeTier ?? h('span', { class: 'muted' }, 'Unknown')),
      field(
        'Used by',
        rows.length
          ? h(
              'ul',
              { class: 'plain' },
              rows.map(({ project, service }) =>
                h(
                  'li',
                  null,
                  h('a', { href: `#/projects/${encodeURIComponent(project.id)}` }, project.name),
                  h('span', { class: 'muted' }, ` · ${labelOf(ROLES, service.role)}${service.state === 'planned' ? ' · planned' : ''}`),
                  service.label ? h('div', { class: 'muted small' }, service.label) : null,
                ),
              ),
            )
          : h('span', { class: 'muted' }, 'No projects'),
      ),
    ),
    provider.notes.length ? h('p', { class: 'muted small' }, provider.notes.join(' ')) : null,
  );
}

export function renderProviders({ inv }) {
  const results = h('div', { class: 'grid' });
  const count = h('p', { class: 'muted summary-line', 'aria-live': 'polite' });
  const draw = () => {
    const list = inv.providers.filter((p) => matchesProvider(p, filters));
    count.textContent = `${list.length} of ${inv.providers.length} providers`;
    results.replaceChildren(...(list.length ? list.map(providerCard) : [emptyState('No providers match your filters.')]));
  };

  const categories = Object.fromEntries([...new Set(inv.providers.map((p) => p.category).filter(Boolean))].map((c) => [c, labelOf(CATEGORIES, c)]));

  const root = h(
    'div',
    null,
    pageHeader('Providers', 'Services and vendors in use, with the projects that depend on them.'),
    h(
      'div',
      { class: 'toolbar' },
      h('input', {
        type: 'search',
        class: 'search',
        placeholder: 'Search providers…',
        'aria-label': 'Search providers',
        value: filters.q,
        oninput: (e) => ((filters.q = e.target.value.trim()), draw()),
      }),
      h(
        'label',
        { class: 'field', for: 'f-category' },
        h('span', { class: 'sr-only' }, 'Category'),
        h(
          'select',
          { id: 'f-category', onchange: (e) => ((filters.category = e.target.value), draw()) },
          h('option', { value: '' }, 'All categories'),
          Object.entries(categories).map(([k, v]) => h('option', { value: k, selected: k === filters.category }, v)),
        ),
      ),
    ),
    count,
    results,
  );
  draw();
  return root;
}
