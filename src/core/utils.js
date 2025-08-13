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
