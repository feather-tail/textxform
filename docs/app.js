import { convert, use } from './dist/index.js';
const autolink = {
  name: 'autolink-demo',
  afterParse(ast) {
    const URL_RE = /\bhttps?:\/\/[^\s<>()]+/g;
    const t = (v) => ({ type: 'Text', value: String(v) });
    const link = (href, children) => ({ type: 'Link', href, title: null, children });

    const map = (nodes = []) =>
      nodes.flatMap((n) => {
        if (n?.type === 'Text') {
          const s = String(n.value || '');
          let i = 0;
          const parts = [];
          s.replace(URL_RE, (m, idx) => {
            if (idx > i) parts.push(t(s.slice(i, idx)));
            parts.push(link(m, [t(m)]));
            i = idx + m.length;
            return m;
          });
          if (!parts.length) return [n];
          if (i < s.length) parts.push(t(s.slice(i)));
          return parts;
        }
        if (Array.isArray(n?.children)) n.children = map(n.children);
        return [n];
      });

    if (Array.isArray(ast.children)) ast.children = map(ast.children);
    return ast;
  },
};

const emoji = {
  name: 'emoji-demo',
  afterParse(ast) {
    const MAP = { smile: '🙂', grin: '😄', wink: '😉', heart: '❤️', thumbsup: '👍' };
    const RE = /:([a-z_]+):/g;
    const t = (v) => ({ type: 'Text', value: String(v) });

    const map = (nodes = []) =>
      nodes.flatMap((n) => {
        if (n?.type === 'Text') {
          const s = String(n.value || '');
          let i = 0;
          const parts = [];
          s.replace(RE, (m, name, idx) => {
            if (idx > i) parts.push(t(s.slice(i, idx)));
            parts.push(t(MAP[name] ?? m));
            i = idx + m.length;
            return m;
          });
          if (!parts.length) return [n];
          if (i < s.length) parts.push(t(s.slice(i)));
          return parts;
        }
        if (Array.isArray(n?.children)) n.children = map(n.children);
        return [n];
      });

    if (Array.isArray(ast.children)) ast.children = map(ast.children);
    return ast;
  },
};

const el = (id) => document.getElementById(id);
const $from = el('from'),
  $to = el('to'),
  $safe = el('safe');
const $useAutolink = el('useAutolink'),
  $useEmoji = el('useEmoji');
const $in = el('input'),
  $out = el('output');

function applyPlugins() {
  if ($useAutolink.checked && !applyPlugins._autolinkOn) {
    use(autolink);
    applyPlugins._autolinkOn = true;
  }
  if ($useEmoji.checked && !applyPlugins._emojiOn) {
    use(emoji);
    applyPlugins._emojiOn = true;
  }
}
applyPlugins._autolinkOn = false;
applyPlugins._emojiOn = false;

function run() {
  applyPlugins();
  try {
    const out = convert($in.value, {
      from: $from.value,
      to: $to.value,
      safe: $safe.checked,
    });
    $out.value = out;
  } catch (e) {
    $out.value = 'Error: ' + (e?.message || String(e));
  }
}
['change', 'input'].forEach((ev) => document.addEventListener(ev, run, true));
run();
