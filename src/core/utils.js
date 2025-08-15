export function escapeHtml(s = '') {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escapeAttr(s = '') {
  return escapeHtml(String(s)).replace(/`/g, '&#96;');
}

export function sanitizeUrl(url = '') {
  const u = String(url || '').trim();
  if (!u) return '#';
  const l = u.toLowerCase();
  if (l.startsWith('http://')) return u;
  if (l.startsWith('https://')) return u;
  if (l.startsWith('mailto:')) return u;
  if (l.startsWith('data:image/')) return u;
  return '#';
}

const NAMED_COLORS = new Set([
  'black',
  'silver',
  'gray',
  'white',
  'maroon',
  'red',
  'purple',
  'fuchsia',
  'green',
  'lime',
  'olive',
  'yellow',
  'navy',
  'blue',
  'teal',
  'aqua',
]);

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function sanitizeColor(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (NAMED_COLORS.has(s)) return s;
  if (HEX_COLOR_RE.test(s)) return s;
  return null;
}

const SIZE_MAP = {
  small: '0.85em',
  normal: '1em',
  large: '1.25em',
  'x-large': '1.5em',
};

export function sanitizeFontSize(v) {
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  if (SIZE_MAP[s]) return SIZE_MAP[s];

  const m = /^([1-9]\d{0,2})%$/.exec(s);
  if (m) {
    const pct = Math.max(50, Math.min(250, parseInt(m[1], 10)));
    if (pct >= 140) return SIZE_MAP['x-large'];
    if (pct >= 115) return SIZE_MAP['large'];
    if (pct <= 95) return SIZE_MAP['small'];
    return SIZE_MAP['normal'];
  }

  return null;
}
