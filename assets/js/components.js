// Shared UI building blocks.

import { h } from './dom.js';
import { BILLING, ROLES, STATUSES, labelOf } from './schema.js';
import { formatMoney, projectCostCoverage } from './costs.js';
import { servicesByRole } from './data.js';

export const badge = (text, tone = 'neutral') => h('span', { class: `badge badge-${tone}` }, text);

export function statusBadge(status) {
  const tone = { active: 'green', planned: 'blue', paused: 'yellow', archived: 'gray' }[status] ?? 'gray';
  return badge(labelOf(STATUSES, status), tone);
}

/** Cost state badge: Unknown / Free / $x per month. Unknown is deliberately distinct from Free. */
export function costBadge(provider) {
  const c = provider.costInfo;
  if (c.state === 'unknown') return badge('Unknown', 'dashed');
  if (c.state === 'free') return badge('Free', 'green');
  const per = c.billing === 'annual' ? 'yr' : 'mo';
  return badge(`${formatMoney(c.amount, provider.currency)}/${per}`, 'blue');
}

export const billingLabel = (provider) => (provider.costInfo.billing ? labelOf(BILLING, provider.costInfo.billing) : '—');

export const monogram = (name) => h('span', { class: 'mono-tile', 'aria-hidden': 'true' }, (name ?? '?').trim().charAt(0).toUpperCase());

export function summaryCard(label, value, sub, extraClass = '') {
  return h(
    'div',
    { class: `card stat ${extraClass}` },
    h('div', { class: 'stat-label' }, label),
    h('div', { class: 'stat-value' }, value),
    sub ? h('div', { class: 'stat-sub' }, sub) : null,
  );
}

export function emptyState(message) {
  return h('div', { class: 'empty' }, message);
}

export function pageHeader(title, subtitle, ...actions) {
  return h(
    'header',
    { class: 'page-header' },
    h('div', null, h('h1', { id: 'page-title', tabindex: '-1' }, title), subtitle ? h('p', { class: 'muted' }, subtitle) : null),
    actions.length ? h('div', { class: 'page-actions' }, actions) : null,
  );
}

function chip(service) {
  const planned = service.state === 'planned';
  const name = service.providerRef?.name ?? service.provider;
  return h(
    'span',
    { class: `chip${planned ? ' chip-planned' : ''}${service.providerRef ? '' : ' chip-missing'}`, title: service.label ?? '' },
    name,
    planned ? h('span', { class: 'chip-note' }, 'planned') : null,
  );
}

function serviceRow(project, role) {
  const services = servicesByRole(project, role);
  return h(
    'div',
    { class: 'kv' },
    h('dt', null, labelOf(ROLES, role) === 'Integration' ? 'Integrations' : labelOf(ROLES, role)),
    h('dd', null, services.length ? h('span', { class: 'chips' }, services.map(chip)) : h('span', { class: 'muted' }, 'None')),
  );
}

export function projectCard(project) {
  const cov = projectCostCoverage(project);
  const coverage = cov.providers === 0 ? 'No services' : `${cov.priced} of ${cov.providers} services priced`;
  return h(
    'article',
    { class: 'card project-card' },
    h(
      'div',
      { class: 'card-head' },
      h('div', { class: 'card-title' }, monogram(project.name), h('h3', null, h('a', { href: `#/projects/${encodeURIComponent(project.id)}` }, project.name))),
      statusBadge(project.status),
    ),
    h('p', { class: project.description ? 'desc' : 'desc muted' }, project.description ?? 'No description.'),
    h('dl', { class: 'kvs' }, serviceRow(project, 'hosting'), serviceRow(project, 'database'), serviceRow(project, 'integration')),
    h('div', { class: 'card-foot muted' }, h('span', null, 'Cost'), h('span', { class: cov.unknown ? 'unknown-text' : '' }, coverage)),
  );
}

export { chip as serviceChip };
