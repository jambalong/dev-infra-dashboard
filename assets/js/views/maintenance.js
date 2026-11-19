import { h } from '../dom.js';
import { badge, emptyState, pageHeader } from '../components.js';
import { loadChecklist, saveChecklist } from '../storage.js';

const todayIso = () => new Date().toISOString().slice(0, 10);

export function pendingTasks(inv) {
  const state = loadChecklist();
  return inv.tasks.filter((t) => !state[t.id]?.completedAt);
}

/** Pending first, then by due date (dated before undated), then file order. */
export function sortPending(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });
}

export function taskScope(task) {
  const names = [...task.projects.map((p) => p.name), ...task.providers.map((p) => p.name)];
  return names.length ? names.join(', ') : 'All infrastructure';
}

export function tasksFor({ project, provider }, inv) {
  return inv.tasks.filter((t) => {
    if (project) return t.projects.includes(project) || t.providers.some((p) => project.services.some((s) => s.providerRef === p));
    if (provider) return t.providers.includes(provider);
    return false;
  });
}

function isOverdue(task, done) {
  return !done && task.due && task.due < todayIso();
}

export function renderTaskRow(task, state, onToggle, { showScope = true } = {}) {
  const entry = state[task.id];
  const done = Boolean(entry?.completedAt);
  const id = `task-${task.id}`;
  return h(
    'li',
    { class: `task${done ? ' done' : ''}` },
    h('input', { type: 'checkbox', id, checked: done, onchange: (e) => onToggle(task, e.target.checked) }),
    h(
      'label',
      { for: id },
      h('span', { class: 'task-title' }, task.title),
      h(
        'span',
        { class: 'task-meta muted' },
        showScope ? taskScope(task) : null,
        task.cadence ? ` · ${task.cadence}` : null,
        task.due ? ` · Due ${task.due}` : null,
        done ? ` · Completed ${entry.completedAt.slice(0, 10)}` : null,
      ),
      task.notes ? h('span', { class: 'task-notes muted' }, task.notes) : null,
    ),
    isOverdue(task, done) ? badge('Overdue', 'red') : null,
  );
}

export function toggleTask(task, checked) {
  const state = loadChecklist();
  if (checked) state[task.id] = { completedAt: new Date().toISOString() };
  else delete state[task.id];
  saveChecklist(state);
}

export function renderMaintenance(ctx) {
  const { inv } = ctx;
  const root = h('div');
  const draw = () => {
    const state = loadChecklist();
    const pending = sortPending(inv.tasks.filter((t) => !state[t.id]?.completedAt));
    const done = inv.tasks.filter((t) => state[t.id]?.completedAt);
    const onToggle = (task, checked) => {
      toggleTask(task, checked);
      ctx.refreshBadges?.();
      draw();
    };
    const resetBtn = h(
      'button',
      {
        class: 'btn',
        type: 'button',
        disabled: done.length === 0,
        onclick: () => {
          saveChecklist({});
          ctx.refreshBadges?.();
          draw();
        },
      },
      'Reset checklist',
    );
    root.replaceChildren(
      pageHeader('Maintenance', 'Recurring infrastructure checks. Completion is saved in this browser only.', resetBtn),
      h('p', { class: 'muted summary-line' }, `${pending.length} pending · ${done.length} completed`),
      inv.tasks.length === 0
        ? emptyState('No maintenance tasks defined in data/maintenance.json.')
        : h(
            'div',
            { class: 'stack' },
            h('section', { class: 'card' }, h('h2', null, 'Pending'), pending.length ? h('ul', { class: 'tasks' }, pending.map((t) => renderTaskRow(t, state, onToggle))) : emptyState('All caught up.')),
            done.length
              ? h('section', { class: 'card' }, h('h2', null, 'Completed'), h('ul', { class: 'tasks' }, done.map((t) => renderTaskRow(t, state, onToggle))))
              : null,
          ),
    );
  };
  draw();
  return root;
}
