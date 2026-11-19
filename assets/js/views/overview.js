import { h } from '../dom.js';
import { emptyState, pageHeader, projectCard, summaryCard } from '../components.js';
import { summarizeCosts } from '../costs.js';
import { CATEGORIES, labelOf } from '../schema.js';
import { knownTotalLabel } from './costs.js';
import { loadChecklist } from '../storage.js';
import { renderTaskRow, sortPending, toggleTask } from './maintenance.js';

export function renderOverview(ctx) {
  const { inv } = ctx;
  const count = (status) => inv.projects.filter((p) => p.status === status).length;
  const costs = summarizeCosts(inv.providers);
  const currency = inv.providers.find((p) => p.costInfo.state !== 'unknown')?.currency ?? 'USD';
  const pendingCount = inv.tasks.filter((t) => !loadChecklist()[t.id]?.completedAt).length;

  const stats = h(
    'div',
    { class: 'stats' },
    summaryCard('Projects', String(inv.projects.length), null),
    summaryCard('Active', String(count('active')), null),
    summaryCard('Planned', String(count('planned')), null),
    summaryCard('Providers', String(inv.providers.length), null),
    summaryCard('Known monthly cost', knownTotalLabel(costs, 'monthly', currency), costs.unknown ? `${costs.unknown} of ${costs.total} unknown` : 'All costs known', costs.known === 0 ? 'stat-unknown' : ''),
    summaryCard('Outstanding tasks', String(pendingCount), `of ${inv.tasks.length} maintenance tasks`),
  );

  // Provider distribution: number of distinct projects using each provider.
  const ranked = [...inv.providers].sort((a, b) => b.projects.length - a.projects.length || a.name.localeCompare(b.name));
  const max = Math.max(1, ...ranked.map((p) => p.projects.length));
  const distribution = h(
    'ul',
    { class: 'bars' },
    ranked.map((p) =>
      h(
        'li',
        null,
        h('div', { class: 'bar-label' }, h('span', null, p.name), h('span', { class: 'muted small' }, labelOf(CATEGORIES, p.category))),
        h('div', { class: 'bar-track', role: 'img', 'aria-label': `${p.projects.length} project${p.projects.length === 1 ? '' : 's'}` }, h('div', { class: 'bar-fill', style: `width:${(p.projects.length / max) * 100}%` })),
        h('span', { class: 'bar-count' }, String(p.projects.length)),
      ),
    ),
  );

  const upcoming = h('ul', { class: 'tasks' });
  const drawUpcoming = () => {
    const state = loadChecklist();
    const pending = sortPending(inv.tasks.filter((t) => !state[t.id]?.completedAt)).slice(0, 5);
    upcoming.replaceChildren(
      ...(pending.length
        ? pending.map((t) =>
            renderTaskRow(t, state, (task, checked) => {
              toggleTask(task, checked);
              ctx.refreshBadges?.();
              drawUpcoming();
            }),
          )
        : [h('li', null, emptyState('Nothing outstanding.'))]),
    );
  };
  drawUpcoming();

  return h(
    'div',
    null,
    pageHeader('Overview', 'Infrastructure behind your projects at a glance.'),
    stats,
    h('section', { class: 'section' }, h('div', { class: 'section-head' }, h('h2', null, 'Projects'), h('a', { href: '#/projects' }, 'View all')), inv.projects.length ? h('div', { class: 'grid' }, inv.projects.map(projectCard)) : emptyState('No projects defined in data/projects.json.')),
    h(
      'div',
      { class: 'two-col' },
      h('section', { class: 'card' }, h('h2', null, 'Provider distribution'), h('p', { class: 'muted small' }, 'Projects using each provider.'), inv.providers.length ? distribution : emptyState('No providers defined.')),
      h('section', { class: 'card' }, h('div', { class: 'section-head' }, h('h2', null, 'Upcoming maintenance'), h('a', { href: '#/maintenance' }, 'View all')), upcoming),
    ),
  );
}
