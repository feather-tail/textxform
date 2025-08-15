import { visit } from '../core/visitor.js';
import * as U from '../core/utils.js';

export function renderHTML(ast, opts = {}) {
  const { safe = true, linkRel = 'noopener noreferrer nofollow', linkTarget = null } = opts;
  const normalize = Boolean(opts.normalizeHtml);
  const preserveTags = Boolean(opts.preserveTags);

  const styleAttr = (style) => {
    if (!style) return '';
    const parts = [];

    const add = (k, v) => {
      if (!v) return;
      parts.push(`${k}:${U.escapeAttr(v)}`);
    };

    if (style['font-size']) {
      const v =
        safe && typeof U.sanitizeFontSize === 'function'
          ? U.sanitizeFontSize(style['font-size'])
          : style['font-size'];
      if (v) add('font-size', v);
    }
    if (style.color) {
      const v =
        safe && typeof U.sanitizeColor === 'function' ? U.sanitizeColor(style.color) : style.color;
      if (v) add('color', v);
    }

    return parts.length ? ` style="${parts.join(';')}"` : '';
  };

  const classAttr = (n) => (n && n.className ? ` class="${U.escapeAttr(n.className)}"` : '');

  const h = {
    Document: (n, _c, r) => n.children.map(r).join('\n'),
    Paragraph: (n, _c, r) =>
      `<p${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join('')}</p>`,
    Text: (n) => U.escapeHtml(n.value ?? ''),
    Heading: (n) => {
      const d = n.depth ?? 1;
      return `<h${d}${classAttr(n)}>${U.escapeHtml(n.value ?? '')}</h${d}>`;
    },
    ThematicBreak: () => `<hr/>`,
    Strong: (n, _c, r) => {
      const tag = preserveTags && !normalize && n._tag === 'b' ? 'b' : 'strong';
      return `<${tag}${classAttr(n)}>${n.children.map(r).join('')}</${tag}>`;
    },
    Emphasis: (n, _c, r) => {
      const tag = preserveTags && !normalize && n._tag === 'i' ? 'i' : 'em';
      return `<${tag}${classAttr(n)}>${n.children.map(r).join('')}</${tag}>`;
    },
    Underline: (n, _c, r) => `<u${classAttr(n)}>${n.children.map(r).join('')}</u>`,
    Strike: (n, _c, r) => `<s${classAttr(n)}>${n.children.map(r).join('')}</s>`,
    InlineCode: (n) => `<code>${U.escapeHtml(n.value ?? '')}</code>`,
    CodeBlock: (n) => `<pre><code>${U.escapeHtml(n.value ?? '')}</code></pre>`,
    LineBreak: () => `<br/>`,

    Link: (n, _c, r) => {
      const href = safe ? U.sanitizeUrl(n.href) : String(n.href || '');
      const title = n.title ? ` title="${U.escapeAttr(n.title)}"` : '';
      const rel = linkRel ? ` rel="${U.escapeAttr(linkRel)}"` : '';
      const target = linkTarget ? ` target="${U.escapeAttr(linkTarget)}"` : '';
      return `<a href="${U.escapeAttr(href)}"${title}${rel}${target}>${n.children.map(r).join('')}</a>`;
    },

    Image: (n) => {
      const src = safe ? U.sanitizeUrl(n.src) : String(n.src || '');
      if (src === '#') return '';
      const alt = n.alt ? ` alt="${U.escapeAttr(n.alt)}"` : ' alt=""';
      return `<img src="${U.escapeAttr(src)}"${alt}>`;
    },

    Blockquote: (n, _c, r) =>
      `<blockquote${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join('')}</blockquote>`,
    Quote: (n, _c, r) => {
      const a = n.author ? ` data-author="${U.escapeAttr(n.author)}"` : '';
      return `<blockquote${a}${classAttr(n)}>${n.children.map(r).join('')}</blockquote>`;
    },

    List: (n, _c, r) => {
      const tag = n.ordered ? 'ol' : 'ul';
      return `<${tag}${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join('')}</${tag}>`;
    },
    ListItem: (n, _c, r) =>
      `<li${classAttr(n)}${styleAttr(n.style)}>${n.children.map(r).join('')}</li>`,

    Spoiler: (n, _c, r) => {
      const summary = `<summary>${U.escapeHtml(n.label ?? 'Спойлер')}</summary>`;
      return `<details>${summary}${n.children.map(r).join('')}</details>`;
    },

    Color: (n, _c, r) => {
      const inner = n.children.map(r).join('');
      const val = typeof U.sanitizeColor === 'function' ? U.sanitizeColor(n.value) : null;
      if (!val) return inner;
      return `<span style="color:${U.escapeAttr(val)}">${inner}</span>`;
    },
    Size: (n, _c, r) => {
      const inner = n.children.map(r).join('');
      const css = typeof U.sanitizeFontSize === 'function' ? U.sanitizeFontSize(n.value) : null;
      if (!css) return inner;
      return `<span style="font-size:${U.escapeAttr(css)}">${inner}</span>`;
    },

    __unknown: () => '',
  };

  return visit(ast, h, {});
}
