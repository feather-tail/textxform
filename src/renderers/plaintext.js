import { visit } from '../core/visitor.js';

export function renderPlaintext(ast) {
  const h = {
    Document: (n, _c, r) => n.children.map(r).join('\n\n'),
    Paragraph: (n, _c, r) => n.children.map(r).join(''),
    Text: (n) => String(n.value ?? ''),
    Heading: (n) => String(n.value ?? ''),
    ThematicBreak: () => '',
    Strong: (n, _c, r) => n.children.map(r).join(''),
    Emphasis: (n, _c, r) => n.children.map(r).join(''),
    Underline: (n, _c, r) => n.children.map(r).join(''),
    Strike: (n, _c, r) => n.children.map(r).join(''),
    InlineCode: (n) => String(n.value ?? ''),
    CodeBlock: (n) => String(n.value ?? ''),
    LineBreak: () => '\n',
    Link: (n, _c, r) => n.children.map(r).join(''),
    Image: (n) => (n.alt ? String(n.alt) : ''),
    Blockquote: (n, _c, r) => n.children.map(r).join('\n'),
    Quote: (n, _c, r) => n.children.map(r).join(''),
    List: (n, _c, r) => n.children.map(r).join('\n'),
    ListItem: (n, _c, r) => n.children.map(r).join(''),
    Spoiler: (n, _c, r) => n.children.map(r).join(''),
    Color: (n, _c, r) => n.children.map(r).join(''),
    Size: (n, _c, r) => n.children.map(r).join(''),
    __unknown: () => '',
  };

  return visit(ast, h, {});
}

export default renderPlaintext;
