import { visit } from '../core/visitor.js';
import * as U from '../core/utils.js';

function stripLeadingWrappers(children, styleFromMeta) {
  let inner = children;
  if (!styleFromMeta) return inner;

  const needColor = Boolean(styleFromMeta.color);
  const needSize = Boolean(styleFromMeta['font-size']);

  let changed = true;
  while (changed && inner.length === 1) {
    changed = false;
    const node = inner[0];
    if (needColor && node.type === 'Color') {
      inner = node.children || [];
      changed = true;
      continue;
    }
    if (needSize && node.type === 'Size') {
      inner = node.children || [];
      changed = true;
      continue;
    }
  }
  return inner;
}

function hoistBlockStyle(children) {
  let style = '';
  let inner = children;

  while (inner.length === 1 && (inner[0].type === 'Color' || inner[0].type === 'Size')) {
    const node = inner[0];
    if (node.type === 'Color') {
      const val =
        typeof U.sanitizeColor === 'function' ? U.sanitizeColor(node.value) : (node.value ?? '');
      if (val) style += (style ? ';' : '') + `color:${String(val)}`;
    } else if (node.type === 'Size') {
      const css =
        typeof U.sanitizeFontSize === 'function'
          ? U.sanitizeFontSize(node.value)
          : (node.value ?? '');
      if (css) style += (style ? ';' : '') + `font-size:${String(css)}`;
    }
    inner = node.children || [];
  }

  return { style, children: inner };
}

export function renderHTML(ast, opts = {}) {
  const { safe = true, linkRel = 'noopener noreferrer nofollow', linkTarget = null } = opts;

  const h = {
    Document: (n, _c, r) => n.children.map(r).join('\n'),

    Paragraph: (n, _c, r) => {
      const tag = n.meta?.tag === 'div' ? 'div' : 'p';

      const metaStyle = n.meta?.style || null;
      let attrsStyle = '';
      let children = n.children || [];

      if (metaStyle && (metaStyle.color || metaStyle['font-size'])) {
        const cssParts = [];
        if (metaStyle.color) {
          const v =
            typeof U.sanitizeColor === 'function'
              ? U.sanitizeColor(metaStyle.color)
              : metaStyle.color;
          if (v) cssParts.push(`color:${String(v)}`);
        }
        if (metaStyle['font-size']) {
          const v =
            typeof U.sanitizeFontSize === 'function'
              ? U.sanitizeFontSize(metaStyle['font-size'])
              : metaStyle['font-size'];
          if (v) cssParts.push(`font-size:${String(v)}`);
        }
        if (cssParts.length) {
          attrsStyle = cssParts.join(';');
          children = stripLeadingWrappers(children, metaStyle);
        }
      } else {
        const hoisted = hoistBlockStyle(children);
        attrsStyle = hoisted.style;
        children = hoisted.children;
      }

      const body = children.map(r).join('');
      const attrs = attrsStyle ? ` style="${U.escapeAttr(attrsStyle)}"` : '';
      return `<${tag}${attrs}>${body}</${tag}>`;
    },

    Text: (n) => U.escapeHtml(n.value ?? ''),

    Heading: (n) => {
      const d = n.depth ?? 1;
      return `<h${d}>${U.escapeHtml(n.value ?? '')}</h${d}>`;
    },

    ThematicBreak: () => `<hr/>`,

    Strong: (n, _c, r) => `<strong>${n.children.map(r).join('')}</strong>`,
    Emphasis: (n, _c, r) => `<em>${n.children.map(r).join('')}</em>`,
    Underline: (n, _c, r) => `<u>${n.children.map(r).join('')}</u>`,
    Strike: (n, _c, r) => `<s>${n.children.map(r).join('')}</s>`,

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

    Blockquote: (n, _c, r) => `<blockquote>${n.children.map(r).join('')}</blockquote>`,

    Quote: (n, _c, r) => {
      const a = n.author ? ` data-author="${U.escapeAttr(n.author)}"` : '';
      return `<blockquote${a}>${n.children.map(r).join('')}</blockquote>`;
    },

    List: (n, _c, r) => {
      const tag = n.ordered ? 'ol' : 'ul';
      return `<${tag}>${n.children.map(r).join('')}</${tag}>`;
    },

    ListItem: (n, _c, r) => `<li>${n.children.map(r).join('')}</li>`,

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
