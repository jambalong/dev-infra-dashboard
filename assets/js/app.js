import { h } from './dom.js';
import { loadInventory } from './data.js';
import { KEYS, readString, remove, writeString } from './storage.js';
import { emptyState } from './components.js';
import { pendingTasks, renderMaintenance } from './views/maintenance.js';
import { renderOverview } from './views/overview.js';
import { renderProjectDetail, renderProjects } from './views/projects.js';
import { renderProviders } from './views/providers.js';
import { renderCosts } from './views/costs.js';

const ROUTES = [
  { path: 'overview', title: 'Overview', render: renderOverview },
  { path: 'projects', title: 'Projects', render: renderProjects },
  { path: 'providers', title: 'Providers', render: renderProviders },
  { path: 'costs', title: 'Costs', render: renderCosts },
  { path: 'maintenance', title: 'Maintenance', render: renderMaintenance },
];

const view = document.getElementById('view');
const nav = document.getElementById('nav');
const root = document.documentElement;
let ctx = null;

/* ---------- Theme: system | light | dark ---------- */

const THEMES = ['system', 'light', 'dark'];
const themeBtn = document.getElementById('theme-toggle');

function currentTheme() {
  const saved = readString(KEYS.theme);
  return THEMES.includes(saved) ? saved : 'system';
}

function applyTheme(theme) {
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
  themeBtn.textContent = `Theme: ${theme[0].toUpperCase()}${theme.slice(1)}`;
}

themeBtn.addEventListener('click', () => {
  const next = THEMES[(THEMES.indexOf(currentTheme()) + 1) % THEMES.length];
  if (next === 'system') remove(KEYS.theme);
  else writeString(KEYS.theme, next);
  applyTheme(next);
});
applyTheme(currentTheme());

/* ---------- Mobile navigation ---------- */

const menuBtn = document.getElementById('menu-toggle');
const scrim = document.getElementById('scrim');

function setMenu(open) {
  document.body.classList.toggle('menu-open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
}
menuBtn.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
scrim.addEventListener('click', () => setMenu(false));
document.addEventListener('keydown', (e) => e.key === 'Escape' && setMenu(false));

/* ---------- Routing ---------- */

function parseHash() {
  const parts = location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  return { section: parts[0] ?? 'overview', id: parts[1] ?? null };
}

function refreshBadges() {
  const el = document.getElementById('nav-maintenance-count');
  if (!el || !ctx) return;
  const n = pendingTasks(ctx.inv).length;
  el.textContent = String(n);
  el.hidden = n === 0;
}

function route() {
  if (!ctx) return;
  const { section, id } = parseHash();
  const found = ROUTES.find((r) => r.path === section);
  let content;
  let title;

  if (section === 'projects' && id) {
    content = renderProjectDetail(ctx, id);
    title = ctx.inv.projectById.get(id)?.name ?? 'Project not found';
  } else if (found) {
    content = found.render(ctx);
    title = found.title;
  } else {
    content = h('div', null, h('h1', { id: 'page-title', tabindex: '-1' }, 'Page not found'), h('p', { class: 'muted' }, 'That page does not exist. '), h('a', { href: '#/overview' }, 'Go to overview'));
    title = 'Not found';
  }

  document.title = `${title} · Infrastructure Dashboard`;
  view.replaceChildren(content);
  for (const a of nav.querySelectorAll('a[data-route]')) {
    const active = a.dataset.route === (found?.path ?? '');
    a.classList.toggle('active', active);
    if (active) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  }
  setMenu(false);
  window.scrollTo(0, 0);
  document.getElementById('page-title')?.focus({ preventScroll: true });
}

/* ---------- Boot ---------- */

async function boot() {
  try {
    const inv = await loadInventory();
    ctx = { inv, refreshBadges };
  } catch (err) {
    console.error(err);
    view.replaceChildren(
      h('h1', { id: 'page-title' }, 'Could not load inventory'),
      emptyState('The JSON files in data/ failed to load or parse. Run `node scripts/validate-data.mjs` and check the browser console.'),
    );
    return;
  }

  const updated = document.getElementById('updated');
  if (ctx.inv.updated) updated.textContent = `Data updated ${ctx.inv.updated}`;

  if (ctx.inv.warnings.length) {
    console.warn('Inventory warnings:\n' + ctx.inv.warnings.join('\n'));
    document.getElementById('warnings').hidden = false;
    document.getElementById('warnings-text').textContent = `${ctx.inv.warnings.length} data warning${ctx.inv.warnings.length === 1 ? '' : 's'}: ${ctx.inv.warnings[0]}`;
  }

  refreshBadges();
  window.addEventListener('hashchange', route);
  route();
}

boot();
