import { h } from '../dom.js';
import { billingLabel, costBadge, pageHeader, summaryCard } from '../components.js';
import { formatMoney, projectCostCoverage, summarizeCosts } from '../costs.js';
import { CATEGORIES, labelOf } from '../schema.js';

const th = (t, cls) => h('th', { scope: 'col', class: cls }, t);

const money = (provider, key) => {
  const v = provider.costInfo[key];
  return v == null ? h('span', { class: 'unknown-text' }, 'Unknown') : formatMoney(v, provider.currency);
};

export function knownTotalLabel(summary, key, currency = 'USD') {
  return summary.known === 0 ? 'Unknown' : formatMoney(summary[key], currency);
}

export function renderCosts({ inv }) {
  const s = summarizeCosts(inv.providers);
  const currency = inv.providers.find((p) => p.costInfo.state !== 'unknown')?.currency ?? 'USD';
  const coverageNote = `${s.known} of ${s.total} providers priced`;

  const providerRows = inv.providers.map((p) =>
    h(
      'tr',
      null,
      h('td', null, p.name, h('div', { class: 'muted small' }, labelOf(CATEGORIES, p.category))),
      h('td', null, p.plan ?? h('span', { class: 'muted' }, 'Unknown')),
      h('td', null, billingLabel(p)),
      h('td', null, costBadge(p)),
      h('td', { class: 'num' }, money(p, 'monthly')),
      h('td', { class: 'num' }, money(p, 'annual')),
      h('td', null, p.projects.length ? p.projects.map((x) => x.name).join(', ') : h('span', { class: 'muted' }, '—')),
    ),
  );

  const projectRows = inv.projects.map((p) => {
    const cov = projectCostCoverage(p);
    const providers = [...new Map(p.services.filter((x) => x.providerRef).map((x) => [x.providerRef.id, x.providerRef])).values()];
    return h(
      'tr',
      null,
      h('td', null, h('a', { href: `#/projects/${encodeURIComponent(p.id)}` }, p.name)),
      h('td', null, providers.length ? h('span', { class: 'chips' }, providers.map((x) => h('span', { class: 'chip' }, x.name, ' ', costBadge(x)))) : h('span', { class: 'muted' }, '—')),
      h('td', null, cov.providers === 0 ? '—' : `${cov.priced} / ${cov.providers}`),
      h('td', null, cov.unknown ? h('span', { class: 'unknown-text' }, `${cov.unknown} unknown`) : cov.providers ? 'All known' : '—'),
    );
  });

  return h(
    'div',
    null,
    pageHeader('Costs', 'Costs are recorded per provider. Unknown costs are shown separately and never counted as zero.'),
    h(
      'div',
      { class: 'stats' },
      summaryCard('Known monthly', knownTotalLabel(s, 'monthly', currency), coverageNote),
      summaryCard('Known annual', knownTotalLabel(s, 'annual', currency), 'Monthly × 12, known costs only'),
      summaryCard('Free services', String(s.free), 'Explicitly recorded as $0'),
      summaryCard('Paid services', String(s.paid), null),
      summaryCard('Unknown costs', String(s.unknown), 'Not yet verified', s.unknown ? 'stat-unknown' : ''),
    ),
    s.unknown
      ? h('p', { class: 'notice' }, `Totals exclude ${s.unknown} provider${s.unknown === 1 ? '' : 's'} with unknown cost. Set a provider's cost in data/providers.json (use 0 only if it is genuinely free).`)
      : null,
    h(
      'section',
      { class: 'card' },
      h('h2', null, 'By provider'),
      h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, th('Provider'), th('Plan'), th('Billing'), th('Cost'), th('Monthly', 'num'), th('Annual', 'num'), th('Projects'))), h('tbody', null, providerRows))),
    ),
    h(
      'section',
      { class: 'card' },
      h('h2', null, 'By project'),
      h('p', { class: 'muted small' }, 'Provider plans can be shared between projects, so costs are not split per project. This shows which of each project’s providers have a known cost.'),
      h('div', { class: 'table-wrap' }, h('table', null, h('thead', null, h('tr', null, th('Project'), th('Providers'), th('Priced'), th('Status'))), h('tbody', null, projectRows))),
    ),
  );
}
