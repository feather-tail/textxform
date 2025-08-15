import { visit } from '../core/visitor.js';

export function renderMarkdown(ast, _opts = {}) {
  const h = {
    Document: (n, _c, r) => n.children.map(r).join('\n\n'),
    Paragraph: (n, _c, r) => n.children.map(r).join(''),
    Text: (n) => String(n.value ?? ''),
    Heading: (n) => '#'.repeat(Math.min(6, Math.max(1, n.depth || 1))) + ' ' + (n.value || ''),
    ThematicBreak: () => '---',
    Color: (n, _c, r) => n.children.map(r).join(''),
    Size: (n, _c, r) => n.children.map(r).join(''),
    Strong: (n, _c, r) => `**${n.children.map(r).join('')}**`,
    Emphasis: (n, _c, r) => `*${n.children.map(r).join('')}*`,
    Underline: (n, _c, r) => `<u>${n.children.map(r).join('')}</u>`,
    Strike: (n, _c, r) => `~~${n.children.map(r).join('')}~~`,
    InlineCode: (n) => '`' + String(n.value ?? '').replace(/`/g, '\\`') + '`',
    CodeBlock: (n) => '```\n' + String(n.value ?? '') + '\n```',
    LineBreak: () => '  \n',
    Link: (n, _c, r) => `[${n.children.map(r).join('')}](${n.href || '#'})`,
    Image: (n) => `![${n.alt || ''}](${n.src || ''})`,
    Blockquote: (n, _c, r) =>
      n.children
        .map(r)
        .join('\n')
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n'),
    Quote: (n, _c, r) =>
      n.children
        .map(r)
        .join('\n')
        .split('\n')
        .map((l) => `> ${l}`)
        .join('\n'),
    List: (n, _c, r) => {
      const renderItem = (li) => r(li).replace(/\n/g, '\n   ');
      if (n.ordered) {
        return n.children.map((li) => `1. ${renderItem(li)}`).join('\n');
      }
      return n.children.map((li) => `- ${renderItem(li)}`).join('\n');
    },
    ListItem: (n, _c, r) => n.children.map(r).join(''),
    Spoiler: (n, _c, r) => `>! ${n.label ? n.label + ': ' : ''}${n.children.map(r).join('')}`,
    __unknown: () => '',
  };
  return visit(ast, h, {});
}
