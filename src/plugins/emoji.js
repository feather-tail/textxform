import { text as t } from '../ast/nodes.js';

const MAP = {
  smile: '🙂',
  grin: '😄',
  wink: '😉',
  heart: '❤️',
  thumbsup: '👍',
};

const RE = /:([a-z_]+):/g;

export const emoji = {
  name: 'emoji',
  afterParse(ast) {
    function transform(nodes) {
      const out = [];
      for (const n of nodes || []) {
        if (!n) continue;

        if (n.type === 'Text') {
          const s = String(n.value || '');
          let i = 0;
          const parts = [];
          s.replace(RE, (m, name, idx) => {
            if (idx > i) parts.push(t(s.slice(i, idx)));
            const ch = MAP[name];
            parts.push(t(ch ?? m));
            i = idx + m.length;
            return m;
          });
          if (parts.length === 0) out.push(n);
          else {
            if (i < s.length) parts.push(t(s.slice(i)));
            out.push(...parts);
          }
          continue;
        }

        if (Array.isArray(n.children)) n.children = transform(n.children);
        out.push(n);
      }
      return out;
    }

    if (Array.isArray(ast.children)) ast.children = transform(ast.children);
    return ast;
  },
};
