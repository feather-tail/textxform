import { text as t, link } from '../ast/nodes.js';

const URL_RE = /\bhttps?:\/\/[^\s<>()]+/g;

export const autolink = {
  name: 'autolink',

  afterParse(ast) {
    function mapChildren(nodes) {
      const out = [];
      for (const n of nodes || []) {
        if (!n) continue;

        if (n.type === 'Text') {
          const s = String(n.value || '');
          let last = 0;
          const parts = [];

          s.replace(URL_RE, (m, idx) => {
            if (idx > last) parts.push(t(s.slice(last, idx)));
            parts.push(link(m, [t(m)]));
            last = idx + m.length;
            return m;
          });

          if (parts.length === 0) {
            out.push(n);
          } else {
            if (last < s.length) parts.push(t(s.slice(last)));
            out.push(...parts);
          }
          continue;
        }

        if (Array.isArray(n.children)) {
          n.children = mapChildren(n.children);
        }
        out.push(n);
      }
      return out;
    }

    if (Array.isArray(ast.children)) {
      ast.children = mapChildren(ast.children);
    }
    return ast;
  },
};
