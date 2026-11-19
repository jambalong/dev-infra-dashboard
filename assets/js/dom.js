// Minimal DOM helpers. Content is always inserted as text nodes (never innerHTML).

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  for (const [key, value] of Object.entries(props ?? {})) {
    if (value == null || value === false) continue;
    if (key === 'class') el.className = value;
    else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2), value);
    else el.setAttribute(key, value === true ? '' : value);
  }
  for (const child of children.flat(Infinity)) {
    if (child == null || child === false) continue;
    el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return el;
}

/** Returns the URL only if it is http(s); otherwise null. */
export function safeUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}

export function externalLink(href, text) {
  const safe = safeUrl(href);
  if (!safe) return h('span', { class: 'muted' }, text ?? '—');
  return h(
    'a',
    { href: safe, target: '_blank', rel: 'noopener noreferrer', class: 'ext' },
    text ?? safe.replace(/^https?:\/\//, ''),
  );
}
