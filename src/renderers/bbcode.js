import { visit } from '../core/visitor.js';

export function renderBBCode(ast, _opts = {}) {
  const h = {
    Document: (n, _c, r) => n.children.map(r).join('\n\n'),
    Paragraph: (n, _c, r) => n.children.map(r).join(''),
    Text: (n) => String(n.value ?? ''),
    Heading: (n) => `[b]${n.value || ''}[/b]`,
    ThematicBreak: () => `[hr]`,
    Color: (n, _c, r) => {
      const val = String(n.value || '').trim();
      const inner = n.children.map(r).join('');
      if (!val) return inner;
      return `[color=${val}]${inner}[/color]`;
    },
    Size: (n, _c, r) => {
      const val = String(n.value || '').trim();
      const inner = n.children.map(r).join('');
      if (!val) return inner;
      return `[size=${val}]${inner}[/size]`;
    },
    Strong: (n, _c, r) => `[b]${n.children.map(r).join('')}[/b]`,
    Emphasis: (n, _c, r) => `[i]${n.children.map(r).join('')}[/i]`,
    Underline: (n, _c, r) => `[u]${n.children.map(r).join('')}[/u]`,
    Strike: (n, _c, r) => `[s]${n.children.map(r).join('')}[/s]`,
    InlineCode: (n) => `[code]${String(n.value ?? '')}[/code]`,
    CodeBlock: (n) => `[code]${String(n.value ?? '')}[/code]`,
    LineBreak: () => `\n`,
    Link: (n, _c, r) =>
      n.href ? `[url=${n.href}]${n.children.map(r).join('')}[/url]` : n.children.map(r).join(''),
    Image: (n) => `[img]${n.src || ''}[/img]`,
    Blockquote: (n, _c, r) => `[quote]${n.children.map(r).join('')}[/quote]`,
    Quote: (n, _c, r) =>
      n.author
        ? `[quote=${n.author}]${n.children.map(r).join('')}[/quote]`
        : `[quote]${n.children.map(r).join('')}[/quote]`,
    List: (n, _c, r) =>
      n.ordered
        ? `[list=1]${n.children.map(r).join('')}[/list]`
        : `[list]${n.children.map(r).join('')}[/list]`,
    ListItem: (n, _c, r) => `[*]${n.children.map(r).join('')}`,
    Spoiler: (n, _c, r) =>
      n.label
        ? `[spoiler=${n.label}]${n.children.map(r).join('')}[/spoiler]`
        : `[spoiler]${n.children.map(r).join('')}[/spoiler]`,
    __unknown: () => '',
  };
  return visit(ast, h, {});
}
