// localStorage wrapper that never throws (private mode, blocked storage, corrupt values).

export const KEYS = {
  theme: 'did.theme',
  maintenance: 'did.maintenance.v1',
};

export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function readString(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeString(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Maintenance state: { [taskId]: { completedAt: ISO string } } */
export function loadChecklist() {
  const state = readJson(KEYS.maintenance, {});
  return state && typeof state === 'object' && !Array.isArray(state) ? state : {};
}

export function saveChecklist(state) {
  writeJson(KEYS.maintenance, state);
}
