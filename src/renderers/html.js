import { visit } from '../core/visitor.js';
import * as U from '../core/utils.js';

export function renderHTML(ast, opts = {}) {
  const { safe = true, linkRel = 'noopener noreferrer nofollow', linkTarget = null } = opts;

  const renderParagraphOpen = (n) => {
    const cls = n.className ? ` class="${U.escapeAttr(n.className)}"` : '';
    const styleObj = n.style || null;
    const styleParts = [];

    if (styleObj && styleObj.color) {
      const color =
        typeof U.sanitizeColor === 'function' ? U.sanitizeColor(styleObj.color) : styleObj.color;
      if (color) styleParts.push(`color:${U.escapeAttr(color)}`);
    }
    if (styleObj && styleObj['font-size']) {
      const fs =
        typeof U.sanitizeFontSize === 'function'
          ? U.sanitizeFontSize(styleObj['font-size'])
          : styleObj['font-size'];
      if (fs) styleParts.push(`font-size:${U.escapeAttr(fs)}`);
    }

    const styleAttr = styleParts.length ? ` style="${styleParts.join(';')}"` : '';
    return `<p${cls}${styleAttr}>`;
  };

  const h = {
    Document: (n, _c, r) => n.children.map(r).join('\n'),
    Paragraph: (n, _c, r) => `${renderParagraphOpen(n)}${n.children.map(r).join('')}</p>`,
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
