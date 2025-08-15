// src/renderers/bbcode.js
import { visit } from '../core/visitor.js';
import * as U from '../core/utils.js';

export function renderBBCode(ast, _opts = {}) {
  const wrapWithStyle = (inner, style) => {
    if (!style) return inner;

    let out = inner;

    if (style['font-size']) {
      const size =
        typeof U.sanitizeFontSize === 'function'
          ? U.sanitizeFontSize(style['font-size'])
          : style['font-size'];
      if (size) out = `[size=${size}]${out}[/size]`;
    }

    if (style.color) {
      const color =
        typeof U.sanitizeColor === 'function' ? U.sanitizeColor(style.color) : style.color;
      if (color) out = `[color=${color}]${out}[/color]`;
    }

    return out;
  };

  const h = {
    Document: (n, _c, r) => n.children.map(r).join('\n\n'),
    Paragraph: (n, _c, r) => {
      const inner = n.children.map(r).join('');
      return wrapWithStyle(inner, n.style || null);
    },
    Text: (n) => String(n.value ?? ''),
    Heading: (n) => String(n.value ?? ''),
    ThematicBreak: () => '---',
    Strong: (n, _c, r) => `[b]${n.children.map(r).join('')}[/b]`,
    Emphasis: (n, _c, r) => `[i]${n.children.map(r).join('')}[/i]`,
    Underline: (n, _c, r) => `[u]${n.children.map(r).join('')}[/u]`,
    Strike: (n, _c, r) => `[s]${n.children.map(r).join('')}[/s]`,
    InlineCode: (n) => `[code]${String(n.value ?? '')}[/code]`,
    CodeBlock: (n) => `[code]\n${String(n.value ?? '')}\n[/code]`,
    LineBreak: () => '\n',
    Link: (n, _c, r) => {
      const href = typeof U.sanitizeUrl === 'function' ? U.sanitizeUrl(n.href) : n.href || '';
      const safeHref = href === '#' ? '' : href;
      const label = n.children.map(r).join('');
      return safeHref ? `[url=${safeHref}]${label}[/url]` : label;
    },
    Image: (n) => {
      const src = typeof U.sanitizeUrl === 'function' ? U.sanitizeUrl(n.src) : n.src || '';
      if (src === '#') return '';
      return `[img]${src}[/img]`;
    },
    Blockquote: (n, _c, r) => `[quote]${n.children.map(r).join('\n\n')}[/quote]`,
    List: (n, _c, r) => {
      const open = n.ordered ? '[list=1]' : '[list]';
      const close = '[/list]';
      return `${open}${n.children.map(r).join('')}${close}`;
    },
    ListItem: (n, _c, r) => `[*]${n.children.map(r).join('')}`,
    Color: (n, _c, r) => `[color=${n.value}]${n.children.map(r).join('')}[/color]`,
    Size: (n, _c, r) => `[size=${n.value}]${n.children.map(r).join('')}[/size]`,
    __unknown: () => '',
  };

  return visit(ast, h, {});
}

export default renderBBCode;
